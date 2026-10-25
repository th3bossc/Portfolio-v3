import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { authConfigured, isAllowedAdmin } from "@/lib/access";
import { databaseConfigured, getRepository } from "@/lib/db";
import type { Entry } from "@/lib/content";

function entryTitle(entry: Entry) {
  const content = entry.draft;
  return content.kind === "profile" ? content.name : content.kind === "experience" ? `${content.organization} · ${content.role}` : content.title;
}
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = authConfigured();
  const session = configured ? await auth() : null;
  if (!session?.user || !isAllowedAdmin(session.user.id)) return <main id="main" className="admin-login"><p className="eyebrow"><span className="small-dot" /> Private workspace</p><h1>Your work.<br />Your words.</h1><p>Manage the portfolio, from a first draft to the published page.</p>{error && <div role="alert" className="form-notice error">Sign-in was unsuccessful. Only the configured GitHub account can access this workspace.</div>}{configured ? <form action={async () => { "use server"; await signIn("github", { redirectTo: "/admin" }); }}><button className="button primary" type="submit">Continue with GitHub ↗</button></form> : <div className="setup-card"><h2>Authentication setup required</h2><p>Configure AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, and ADMIN_GITHUB_ID in your environment. Setup steps are in the README.</p><p>Admin access remains locked until configuration is complete.</p></div>}<Link href="/" className="back-link">← Back to the portfolio</Link></main>;
  if (!databaseConfigured()) return <main id="main" className="admin-shell"><h1>Connect your database.</h1><p className="muted">Add MONGODB_URI and MONGODB_DB to your environment, then restart the application.</p></main>;
  let entries: Entry[];
  try { entries = await (await getRepository()).list(); } catch { return <main id="main" className="admin-shell"><h1>Database unavailable.</h1><p className="muted">Check the connection, network access, and database permissions, then reload.</p></main>; }
  const live = entries.filter((entry) => entry.published && !entry.archived).length;
  return <main id="main" className="admin-shell"><div className="admin-title"><div><p className="eyebrow">Portfolio / Content studio</p><h1>Make it yours.</h1><p className="muted">{entries.length} entries · {live} published. Drafts stay private until you publish.</p></div><form action={async () => { "use server"; await signOut({ redirectTo: "/admin" }); }}><button className="button secondary">Sign out</button></form></div><div className="admin-toolbar"><Link className="button secondary" href="/admin/preview">Preview all drafts ↗</Link></div><div className="admin-new"><span>Create an entry</span>{(["profile", "experience", "project", "skill"] as const).filter((kind) => kind !== "profile" || !entries.some((e) => e.kind === "profile")).map((kind) => <Link className="button secondary" key={kind} href={`/admin/new?kind=${kind}`}>+ {kind === "skill" ? "Skill group" : kind[0].toUpperCase() + kind.slice(1)}</Link>)}</div><div className="admin-list">{entries.map((entry) => <Link className="admin-row" href={`/admin/${entry._id}`} key={entry._id}><span className="entry-order">{entry.order}</span><div><span className="eyebrow">{entry.kind}</span><h2>{entryTitle(entry)}</h2><p>Updated {new Date(entry.updatedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</p></div><span className={`status-chip ${entry.published && !entry.archived ? "published" : ""}`}>{entry.archived ? "Archived" : entry.published ? (JSON.stringify(entry.draft) !== JSON.stringify(entry.published) || entry.order !== entry.publishedOrder ? "Published · draft changes" : "Published") : "Draft"}</span><span>↗</span></Link>)}{!entries.length && <div className="empty-state"><h2>A blank canvas.</h2><p>Create your first entry above, or run the documented local content migration.</p></div>}</div></main>;
}
