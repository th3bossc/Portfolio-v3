import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import { getRepository } from "@/lib/db";
import { ContentEditor } from "@/components/content-editor";
import type { Content } from "@/lib/content";

const blanks: Record<string, Content> = {
  profile: { kind: "profile", name: "", role: "", headline: "", about: "", links: [], imageUrl: "", resumeUrl: "" },
  experience: { kind: "experience", organization: "", role: "", start: "", end: "", group: "", description: "" },
  project: { kind: "project", visualVariant: "generic", homepageCaseStudy: false, title: "", slug: "", category: "Backend", context: "Personal project", featured: false, summary: "", contribution: "", stack: [], links: [], imageUrl: "", caseStudy: [] },
  skill: { kind: "skill", title: "", skills: [] },
};
export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kind?: string; saved?: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin"); }
  const { id } = await params;
  const { kind, saved } = await searchParams;
  if (id === "new") {
    if (!kind || !Object.hasOwn(blanks, kind)) notFound();
    return <ContentEditor key={kind} initial={blanks[kind]} />;
  }
  const entry = (await (await getRepository()).list()).find((item) => item._id === id);
  if (!entry) notFound();
  return <>{saved && <p className="form-notice success admin-shell" role="status">Draft created. It is not public until published.</p>}<ContentEditor key={id} initial={entry.draft} entry={entry} /></>;
}
