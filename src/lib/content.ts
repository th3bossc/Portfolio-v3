import { z } from "zod";

const short = z.string().trim().min(1).max(200);
export const safeUrl = z.string().trim().url().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}, "Use an HTTPS URL without embedded credentials.");
const optionalUrl = z.union([safeUrl, z.literal("")]).optional().default("");
const link = z.object({ label: short, url: safeUrl });
const markdown = z.string().trim().max(12000);
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM.");
export const categories = ["Systems", "Backend", "AI"] as const;

const optionalMark = z.string().trim().max(8).optional();
export const visualVariants = ["generic", "pipeline", "webpage", "summary"] as const;

export const profileSchema = z.object({
  kind: z.literal("profile"), name: short, role: short, brandMark: optionalMark,
  headline: z.string().trim().min(1).max(300),
  intro: z.string().trim().max(300).optional(), supportingLine: z.string().trim().max(300).optional(),
  about: markdown.min(1),
  links: z.array(link).min(1).max(8), imageUrl: optionalUrl, resumeUrl: optionalUrl,
});
export const experienceSchema = z.object({
  kind: z.literal("experience"), organization: short, organizationMark: optionalMark, role: short,
  start: month, end: z.union([month, z.literal("")]),
  group: z.string().trim().max(100).default(""), description: markdown.default(""),
}).refine((entry) => !entry.end || entry.end >= entry.start, { path: ["end"], message: "End must be after start." });
export const projectSchema = z.object({
  kind: z.literal("project"), title: short,
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  category: z.enum(categories), summary: z.string().trim().min(1).max(1000),
  contribution: markdown.default(""), stack: z.array(short).min(1).max(30),
  links: z.array(link).max(8), imageUrl: optionalUrl, featured: z.boolean(),
  visualVariant: z.enum(visualVariants).default("generic"), homepageCaseStudy: z.boolean().default(false),
  context: z.enum(["Personal project", "Team project", "Academic project", "Final-year project"]),
  caseStudy: z.array(z.object({ title: short, body: markdown.min(1) })).max(12).default([]),
});
export const skillSchema = z.object({ kind: z.literal("skill"), title: short, skills: z.array(short).min(1).max(40) });
export const contentSchema = z.discriminatedUnion("kind", [profileSchema, experienceSchema, projectSchema, skillSchema]);
export type Content = z.infer<typeof contentSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillGroup = z.infer<typeof skillSchema>;
export type Kind = Content["kind"];
export type Entry = {
  _id: string; kind: Kind; draft: Content; published: Content | null;
  order: number; publishedOrder: number | null; revision: number; archived: boolean;
  slugKeys?: string[]; createdAt: string; updatedAt: string; publishedAt: string | null;
};
export type Portfolio = { profile: Profile | null; experiences: Experience[]; projects: Project[]; skills: SkillGroup[] };
export function toPortfolio(contents: Content[]): Portfolio {
  return {
    profile: contents.find((c): c is Profile => c.kind === "profile") ?? null,
    experiences: contents.filter((c): c is Experience => c.kind === "experience"),
    projects: contents.filter((c): c is Project => c.kind === "project"),
    skills: contents.filter((c): c is SkillGroup => c.kind === "skill"),
  };
}
export function projectSlugs(draft: Content, published: Content | null): string[] | undefined {
  return draft.kind === "project" ? [...new Set([draft.slug, ...(published?.kind === "project" ? [published.slug] : [])])] : undefined;
}
export function newEntry(content: Content, id: string, order: number): Entry {
  const date = new Date().toISOString();
  return { _id: id, kind: content.kind, draft: content, published: null, order, publishedOrder: null,
    revision: 1, archived: false, createdAt: date, updatedAt: date, publishedAt: null,
    ...(content.kind === "project" ? { slugKeys: [content.slug] } : {}) };
}
export function dateLabel(start: string, end: string) {
  const format = (date: string) => new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}-01T00:00:00Z`));
  return `${format(start)} — ${end ? format(end) : "Present"}`;
}

export function profileDescription(profile: Profile | null): string | undefined {
  return profile?.supportingLine || profile?.headline;
}

export function initials(name: string) { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => [...part][0]).join("").toUpperCase(); }
