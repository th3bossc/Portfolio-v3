import Link from "next/link";
import { MotionSurface } from "./motion-surface";
import type { Project } from "@/lib/content";
import { Arrow, Mark } from "./icons";
import { ProjectVisual } from "./project-visual";
import { Markdown } from "./markdown";

export function ProjectCard({ project, large = false, href }: { project: Project; large?: boolean; href?: string }) {
  return <article className={`project-card ${large ? "project-card-featured" : ""}`}>
    <div className="project-art">{project.imageUrl ? <img src={project.imageUrl} alt={`${project.title} project preview`} loading="lazy" referrerPolicy="no-referrer" /> : <ProjectVisual variant={project.visualVariant} />}</div>
    <div className="project-card-copy"><div className="card-kicker"><span>{project.category}</span><span>{project.context}</span></div><h3><Link href={href ?? `/projects/${project.slug}`}>{project.title}<Arrow diagonal /></Link></h3><p>{project.summary}</p><div className="tags">{project.stack.slice(0, large ? 6 : 4).map((tech) => <span key={tech}>{tech}</span>)}</div><Link className="text-link" href={href ?? `/projects/${project.slug}`}>{project.caseStudy.length ? "Explore the case study" : "View project"}<Arrow /></Link></div>
  </article>;
}
export function ProjectRow({ project }: { project: Project }) {
  return <article className="project-row"><div className="project-row-icon"><Mark type={project.category} /></div><div><div className="card-kicker"><span>{project.category}</span><span>{project.context}</span></div><h2><Link href={`/projects/${project.slug}`}>{project.title}</Link></h2><p>{project.summary}</p><div className="tags">{project.stack.slice(0, 6).map((tech) => <span key={tech}>{tech}</span>)}</div></div><Link className="circle-link" href={`/projects/${project.slug}`} aria-label={`Read about ${project.title}`}><Arrow diagonal /></Link></article>;
}
export function ProjectDetail({ project, preview = false }: { project: Project; preview?: boolean }) {
  return <MotionSurface><main id="main" className="shell project-detail"><Link className="back-link" href={preview ? "/admin/preview" : "/projects"}>← {preview ? "Full preview" : "All projects"}</Link><div className="card-kicker"><span>{project.category}</span><span>{project.context}</span></div><h1>{project.title}<span className="teal">.</span></h1><p className="project-intro">{project.summary}</p><div className="detail-links">{project.links.map((link) => <a className="button secondary" key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}<Arrow diagonal /></a>)}</div>
    {(project.imageUrl || project.visualVariant !== "generic") && <div className="detail-art">{project.imageUrl ? <img src={project.imageUrl} alt={`${project.title} preview`} referrerPolicy="no-referrer" /> : <ProjectVisual variant={project.visualVariant} />}</div>}
    <div className="detail-body"><aside><p className="eyebrow">Technology</p><div className="tags">{project.stack.map((tech) => <span key={tech}>{tech}</span>)}</div><p className="detail-note">{project.context === "Academic project" ? "Course implementation using supplied specifications and tooling." : project.context === "Team project" ? "Stack shown represents the team project." : project.context}</p></aside><div>{project.contribution && <section className="contribution"><p className="eyebrow">Contribution</p><Markdown text={project.contribution} /></section>}{project.caseStudy.length > 0 && <section><p className="eyebrow">Decisions behind the implementation</p><h2>Engineering is a<br />series of tradeoffs.</h2><div className="case-study">{project.caseStudy.map((section, index) => <article key={index}><span className="section-number">0{index + 1}</span><div><h3>{section.title}</h3><Markdown text={section.body} /></div></article>)}</div></section>}</div></div>
  </main></MotionSurface>;
}
