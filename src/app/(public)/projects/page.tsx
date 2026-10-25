import Link from "next/link";
import { MotionSurface } from "@/components/motion-surface";
import { getPortfolio } from "@/lib/public-data";
import { categories } from "@/lib/content";
import { ProjectRow } from "@/components/projects";
export const metadata = { title: "Projects", description: "Real-time testing, AI applications, and academic systems projects.", alternates: { canonical: "/projects" } };
export default async function Projects({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const selected = categories.find((item) => item === category) ?? "All";
  const { projects } = await getPortfolio();
  const filtered = selected === "All" ? projects : projects.filter((p) => p.category === selected);
  return <MotionSurface key={selected}><main id="main" className="shell project-index"><p className="eyebrow"><span className="small-dot" /> The work</p><h1>Ideas, implemented<span className="teal">.</span></h1><p className="page-intro">A collection of platforms, applications, and experiments.<br />Each with a problem to solve and a decision to make.</p><nav className="filters" aria-label="Filter projects">{["All", ...categories].map((item) => <Link key={item} aria-current={selected === item ? "page" : undefined} href={item === "All" ? "/projects" : `/projects?category=${item}`}>{item}<span>{item === "All" ? projects.length : projects.filter((p) => p.category === item).length}</span></Link>)}</nav><div className="project-list">{filtered.map((project) => <ProjectRow key={project.slug} project={project} />)}{!filtered.length && <p className="empty-state">No published projects in this category yet.</p>}</div></main></MotionSurface>;
}
