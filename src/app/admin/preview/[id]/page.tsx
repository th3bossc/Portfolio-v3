import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import { getRepository } from "@/lib/db";
import { ProjectDetail } from "@/components/projects";
export default async function PreviewProject({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin"); }
  const { id } = await params;
  const entry = (await (await getRepository()).list()).find((item) => item._id === id && !item.archived);
  if (!entry || entry.draft.kind !== "project") notFound();
  return <><div className="preview-banner">Private preview · Saved draft <Link href={`/admin/${id}`}>Back to editor →</Link></div><ProjectDetail project={entry.draft} preview /></>;
}
