import type { MetadataRoute } from "next";
import { getPortfolio, siteUrl } from "@/lib/public-data";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects } = await getPortfolio();
  return ["", "/projects", ...projects.map((project) => `/projects/${project.slug}`)].map((path) => ({ url: `${siteUrl()}${path}`, changeFrequency: "monthly", priority: path === "" ? 1 : 0.7 }));
}
