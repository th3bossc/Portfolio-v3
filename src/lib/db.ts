import { MongoClient } from "mongodb";
import { ContentRepository } from "./repository";
import type { Entry } from "./content";

const globalMongo = globalThis as typeof globalThis & { portfolioRepository?: Promise<ContentRepository> };
export function databaseConfigured() { return Boolean(process.env.MONGODB_URI); }
export async function getRepository(): Promise<ContentRepository> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Database is not configured.");
  if (!globalMongo.portfolioRepository) {
    globalMongo.portfolioRepository = (async () => {
      const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
      try {
        await client.connect();
        const repo = new ContentRepository(client.db(process.env.MONGODB_DB || "portfolio").collection<Entry>("content"));
        await repo.indexes();
        return repo;
      } catch (error) { await client.close(); throw error; }
    })();
  }
  try { return await globalMongo.portfolioRepository; }
  catch (error) { globalMongo.portfolioRepository = undefined; throw error; }
}
