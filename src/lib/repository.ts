import { type Collection, MongoServerError } from "mongodb";
import { contentSchema, newEntry, projectSlugs, type Entry, type Content } from "./content";

export class ContentError extends Error {}
export class ContentRepository {
  constructor(private readonly collection: Collection<Entry>) {}

  async indexes() {
    await this.collection.createIndex({ slugKeys: 1 }, { unique: true, partialFilterExpression: { kind: "project" }, name: "unique_project_slugs" });
    await this.collection.createIndex({ kind: 1 }, { unique: true, partialFilterExpression: { kind: "profile" }, name: "single_profile" });
    await this.collection.createIndex({ archived: 1, publishedOrder: 1 });
  }
  async list() { return this.collection.find().sort({ order: 1, _id: 1 }).toArray(); }
  async publicContent(): Promise<Content[]> {
    const records = await this.collection.find({ archived: false, published: { $ne: null } }, { projection: { published: 1, publishedOrder: 1 } }).sort({ publishedOrder: 1, _id: 1 }).toArray();
    return records.flatMap((record) => record.published ? [contentSchema.parse(record.published)] : []);
  }
  async create(input: unknown, id: string, order: number) {
    const content = contentSchema.parse(input);
    await this.guard(() => this.collection.insertOne(newEntry(content, id, this.order(order))));
    return id;
  }
  async save(id: string, revision: number, input: unknown, order: number) {
    const draft = contentSchema.parse(input);
    const entry = await this.current(id, revision);
    if (entry.archived) throw new ContentError("Restore this entry before editing it.");
    if (entry.kind !== draft.kind) throw new ContentError("An entry’s content type cannot be changed.");
    const slugKeys = projectSlugs(draft, entry.published);
    await this.update(id, revision, { draft, order: this.order(order), ...(slugKeys ? { slugKeys } : {}) });
  }
  async publish(id: string, revision: number) {
    const entry = await this.current(id, revision);
    if (entry.archived) throw new ContentError("Restore this entry before publishing it.");
    const published = contentSchema.parse(entry.draft);
    const slugKeys = projectSlugs(published, published);
    await this.update(id, revision, { published, publishedOrder: entry.order, publishedAt: new Date().toISOString(), ...(slugKeys ? { slugKeys } : {}) });
  }
  async unpublish(id: string, revision: number) {
    const entry = await this.current(id, revision);
    const slugKeys = projectSlugs(entry.draft, null);
    await this.update(id, revision, { published: null, publishedOrder: null, publishedAt: null, ...(slugKeys ? { slugKeys } : {}) });
  }
  async archive(id: string, revision: number) {
    const entry = await this.current(id, revision);
    const slugKeys = projectSlugs(entry.draft, null);
    await this.update(id, revision, { archived: true, published: null, publishedOrder: null, publishedAt: null, ...(slugKeys ? { slugKeys } : {}) });
  }
  async restore(id: string, revision: number) {
    await this.current(id, revision);
    await this.update(id, revision, { archived: false });
  }
  private order(order: number) {
    if (!Number.isInteger(order) || order < 0 || order > 10000) throw new ContentError("Order must be a whole number between 0 and 10000.");
    return order;
  }
  private async current(id: string, revision: number) {
    const entry = await this.collection.findOne({ _id: id, revision });
    if (!entry) throw new ContentError("This entry changed in another session. Reload before saving.");
    return entry;
  }
  private async update(id: string, revision: number, fields: Partial<Entry>) {
    const result = await this.guard(() => this.collection.updateOne({ _id: id, revision }, { $set: { ...fields, updatedAt: new Date().toISOString() }, $inc: { revision: 1 } }));
    if (!result.matchedCount) throw new ContentError("This entry changed in another session. Reload before saving.");
  }
  private async guard<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) throw new ContentError("That slug is reserved by another draft, published, or archived project, or a profile already exists.");
      throw error;
    }
  }
}
