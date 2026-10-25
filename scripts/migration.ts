import { z } from "zod";
import { contentSchema, type Entry } from "../src/lib/content";

export const migrationSchema = z.object({
  version: z.literal(1),
  entries: z.array(z.object({
    id: z.string().min(1).max(100),
    order: z.number().int().min(0).max(10000),
    content: contentSchema,
  })).min(1).max(1000),
}).superRefine(({ entries }, ctx) => {
  const ids = new Set<string>(); const slugs = new Set<string>(); let profiles = 0;
  entries.forEach((entry, index) => {
    if (ids.has(entry.id)) ctx.addIssue({ code: "custom", path: ["entries", index, "id"], message: "Duplicate ID." });
    ids.add(entry.id);
    if (entry.content.kind === "profile" && ++profiles > 1) ctx.addIssue({ code: "custom", message: "Only one profile is allowed." });
    if (entry.content.kind === "project") {
      if (slugs.has(entry.content.slug)) ctx.addIssue({ code: "custom", message: "Duplicate project slug." });
      slugs.add(entry.content.slug);
    }
  });
});
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
export function planMigration(input: z.infer<typeof migrationSchema>, existing: Entry[]) {
  const conflicts: string[] = [];
  const create: string[] = []; const publish: string[] = []; const unchanged: string[] = [];
  for (const entry of input.entries) {
    const found = existing.find((record) => record._id === entry.id);
    const reserved = existing.find((record) => record._id !== entry.id && (
      (entry.content.kind === "profile" && record.kind === "profile") ||
      (entry.content.kind === "project" && record.slugKeys?.includes(entry.content.slug))
    ));
    if (reserved) conflicts.push(`${entry.id}: profile or slug is reserved by ${reserved._id}.`);
    if (!found) { create.push(entry.id); publish.push(entry.id); continue; }
    const draft = contentSchema.safeParse(found.draft);
    const published = found.published ? contentSchema.safeParse(found.published) : null;
    if (found.archived || found.kind !== entry.content.kind || found.order !== entry.order ||
        !draft.success || canonical(draft.data) !== canonical(entry.content) ||
        (published && (!published.success || canonical(published.data) !== canonical(entry.content) || found.publishedOrder !== entry.order))) {
      conflicts.push(`${entry.id}: existing content, order, or archive state differs. No automatic overwrite.`);
    } else if (!found.published) publish.push(entry.id);
    else unchanged.push(entry.id);
  }
  return { conflicts, create, publish, unchanged };
}
