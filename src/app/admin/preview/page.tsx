import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import { getRepository } from "@/lib/db";
import { toPortfolio } from "@/lib/content";
import { Header, Footer } from "@/components/site-chrome";
import { Home } from "@/components/home";
export default async function PreviewPage() {
  try { await requireAdmin(); } catch { redirect("/admin"); }
  const entries = (await (await getRepository()).list()).filter((entry) => !entry.archived);
  const data = toPortfolio(entries.map((entry) => entry.draft));
  const ids = Object.fromEntries(entries.flatMap((entry) => entry.draft.kind === "project" ? [[entry.draft.slug, entry._id]] : []));
  return <><div className="preview-banner">Private preview · All saved drafts, including unpublished content <Link href="/admin">Return to studio →</Link></div><Header profile={data.profile} preview /><Home data={data} previewIds={ids} /><Footer profile={data.profile} /></>;
}
