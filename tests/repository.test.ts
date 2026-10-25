import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Collection } from "mongodb";
import { ContentRepository } from "../src/lib/repository";
import { fixtureContent } from "./fixtures";
import type { Entry, Project } from "../src/lib/content";

let server: MongoMemoryServer;
let client: MongoClient;
let collection: Collection<Entry>;
let repo: ContentRepository;
const source = fixtureContent.find((entry) => entry.id === "pipeline")!.content as Project;
beforeAll(async () => {
  server = await MongoMemoryServer.create({ binary: { version: "8.2.6" } });
  client = await new MongoClient(server.getUri()).connect();
  collection = client.db("portfolio_test").collection<Entry>("content");
  repo = new ContentRepository(collection);
  await repo.indexes();
});
afterAll(async () => { await client?.close(); await server?.stop(); });
beforeEach(async () => { await collection.deleteMany({}); });

describe("MongoDB publication lifecycle", () => {
  it("keeps draft edits and ordering private until publication", async () => {
    await repo.create(source, "one", 10);
    expect(await repo.publicContent()).toEqual([]);
    await repo.publish("one", 1);
    await repo.save("one", 2, { ...source, summary: "A private draft", slug: "new-slug" }, 30);
    expect((await repo.publicContent())[0]).toMatchObject({ summary: source.summary, slug: source.slug });
    expect(await collection.findOne({ _id: "one" })).toMatchObject({ order: 30, publishedOrder: 10 });
    await repo.publish("one", 3);
    expect((await repo.publicContent())[0]).toMatchObject({ summary: "A private draft", slug: "new-slug" });
  });
  it("reserves draft and live slugs across records, then releases the old slug on publish", async () => {
    await repo.create(source, "one", 10); await repo.publish("one", 1);
    await repo.save("one", 2, { ...source, slug: "new-slug" }, 10);
    await expect(repo.create(source, "two", 20)).rejects.toThrow("reserved");
    await expect(repo.create({ ...source, slug: "new-slug" }, "two", 20)).rejects.toThrow("reserved");
    await repo.publish("one", 3);
    await repo.create(source, "two", 20);
    expect(await repo.list()).toHaveLength(2);
  });
  it("rejects stale concurrent edits and invalid updates", async () => {
    await repo.create(source, "one", 10);
    await repo.save("one", 1, { ...source, title: "New title" }, 10);
    await expect(repo.save("one", 1, source, 10)).rejects.toThrow("another session");
    await expect(repo.save("one", 2, { ...source, slug: "INVALID SLUG" }, 10)).rejects.toThrow();
    await expect(repo.save("one", 2, source, -1)).rejects.toThrow("Order");
  });
  it("unpublishes, archives, and restores without accidentally republishing", async () => {
    await repo.create(source, "one", 10); await repo.publish("one", 1);
    await repo.unpublish("one", 2); expect(await repo.publicContent()).toEqual([]);
    await repo.publish("one", 3); await repo.archive("one", 4);
    expect(await repo.publicContent()).toEqual([]);
    await expect(repo.publish("one", 5)).rejects.toThrow("Restore");
    await repo.restore("one", 5);
    expect(await repo.publicContent()).toEqual([]);
    expect(await collection.findOne({ _id: "one" })).toMatchObject({ archived: false, published: null });
  });
  it("enforces a single profile and returns only public content fields", async () => {
    const profile = fixtureContent[0].content;
    await repo.create(profile, "profile", 0);
    await expect(repo.create(profile, "another-profile", 0)).rejects.toThrow("profile");
    await repo.publish("profile", 1);
    const result = await repo.publicContent();
    expect(result[0]).not.toHaveProperty("draft"); expect(result[0]).not.toHaveProperty("_id");
    expect(result[0]).not.toHaveProperty("revision");
  });
  it("keeps new profile introduction fields private until explicitly published", async () => {
    const original = fixtureContent[0].content;
    if (original.kind !== "profile") throw new Error("Expected profile");
    const { intro, supportingLine, ...legacy } = original;
    await repo.create(legacy, "profile", 0);
    await repo.publish("profile", 1);
    await repo.save("profile", 2, { ...legacy, intro, supportingLine }, 0);
    expect((await repo.publicContent())[0]).not.toHaveProperty("intro");
    await repo.publish("profile", 3);
    expect((await repo.publicContent())[0]).toMatchObject({ intro, supportingLine });
  });

});
