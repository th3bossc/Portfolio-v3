import { cache } from "react";
import { toPortfolio } from "./content";
import { databaseConfigured, getRepository } from "./db";

// Deduplicate within a request, without persisting stale database snapshots.
// External migrations and admin publications are visible on the next request.
export const getPortfolio = cache(async () => {
  if (!databaseConfigured()) return toPortfolio([]);
  return toPortfolio(await (await getRepository()).publicContent());
});

export function siteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}
