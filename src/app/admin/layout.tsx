import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = { title: "Content studio", robots: { index: false, follow: false, nocache: true } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root"><header className="admin-header"><Link href="/admin" className="brand"><span>Content studio</span></Link><Link className="text-link" href="/">View website ↗</Link></header>{children}</div>;
}
