import Link from "next/link";
import { MotionSurface } from "./motion-surface";
import { dateLabel, initials, type Experience, type Portfolio } from "@/lib/content";
import { Arrow } from "./icons";
import { Markdown } from "./markdown";
import { ProjectCard } from "./projects";
import { Contact } from "./site-chrome";

function ExperienceTimeline({ entries }: { entries: Experience[] }) {
  const groups = new Map<string, Experience[]>();
  entries.forEach((entry, index) => { const key = entry.group || `${entry.organization}-${index}`; groups.set(key, [...(groups.get(key) ?? []), entry]); });
  return <div className="experience-list"><span className="experience-track" aria-hidden="true"><span /></span>{[...groups.entries()].map(([key, group]) => <article className="experience-group" key={key}><div className="organization"><span className="org-mark">{group[0].organizationMark || initials(group[0].organization)}</span><h3>{group[0].organization}</h3></div><div className={`roles ${group.length > 1 ? "progression" : ""}`}>{group.map((entry) => <div className="role" key={`${entry.role}-${entry.start}`}><div><h4>{entry.role}</h4><span className="role-date">{dateLabel(entry.start, entry.end)}</span></div>{!entry.end && <span className="current-label">Current</span>}{entry.description && <Markdown text={entry.description} />}</div>)}</div></article>)}</div>;
}
export function Home({ data, previewIds }: { data: Portfolio; previewIds?: Record<string, string> }) {
  const profile = data.profile;
  if (!profile) return <main id="main" className="shell empty-site"><p className="eyebrow">A work in progress</p><h1>Something considered<br />is on its way<span className="teal">.</span></h1><p>This portfolio will be available soon.</p></main>;
  const featured = data.projects.filter((project) => project.featured);
  const linkedIn = profile.links.find((link) => /linkedin/i.test(link.label));
  const approachProject = data.projects.find((project) => project.homepageCaseStudy && project.caseStudy.length > 0);
  const approach = approachProject?.caseStudy.slice(0, 3) ?? [];
  return <MotionSurface><main id="main">
    <section className="hero shell">
      <h1>{profile.headline}</h1>
      {profile.intro && <p className="hero-intro" data-hero="0">{profile.intro}</p>}
      {profile.supportingLine && <p className="hero-support" data-hero="1">{profile.supportingLine}</p>}
      <div className="hero-actions" data-hero="2"><a className="button primary" href="#work">Explore my work <Arrow /></a>{linkedIn && <a className="button secondary" href={linkedIn.url} target="_blank" rel="noopener noreferrer">Connect on LinkedIn <Arrow diagonal /></a>}</div>
      <div className="hero-foot"><a href="#experience" aria-label="Scroll to experience">↓</a></div>
    </section>
    <section id="experience" className="section shell"><div className="section-heading"><p className="eyebrow"><span>01</span> Experience</p><h2>Building in the real world.</h2></div><div className="experience-layout"><div className="about-copy">{profile.imageUrl && <img className="portrait" src={profile.imageUrl} alt={profile.name} loading="lazy" referrerPolicy="no-referrer" />}<Markdown text={profile.about} /></div><ExperienceTimeline entries={data.experiences} /></div></section>
    <section id="work" className="section work-section shell"><div className="section-heading with-link"><div><p className="eyebrow"><span>02</span> Selected work</p><h2>From problem to platform.</h2></div><Link className="text-link" href={previewIds ? "#work" : "/projects"}>All projects <Arrow /></Link></div><div className="featured-grid">{featured.map((project, index) => <ProjectCard key={project.slug} project={project} large={index === 0} href={previewIds ? `/admin/preview/${previewIds[project.slug]}` : undefined} />)}</div>{!featured.length && <p className="muted">Selected projects will appear here.</p>}</section>
    {approach.length > 0 && <section className="section approach-section"><div className="shell"><div className="section-heading"><p className="eyebrow"><span>03</span> How I think</p><h2>The decisions matter<br /><span className="muted">as much as the code.</span></h2><p className="section-intro">A few lessons from building {approachProject?.title}.</p></div><div className="approach-grid">{approach.map((item, i) => <article key={item.title}><span className="section-number">0{i + 1} /</span><h3>{item.title}</h3><Markdown text={item.body} /></article>)}</div></div></section>}
    <section id="expertise" className="section shell"><div className="section-heading"><p className="eyebrow"><span>04</span> Expertise</p><h2>A toolkit, built through practice.</h2></div><div className="skills-grid">{data.skills.map((group, i) => <article key={group.title}><span className="skill-index">0{i + 1}</span><h3>{group.title}</h3><p>{group.skills.join(" · ")}</p></article>)}</div></section>
    <Contact profile={profile} />
  </main></MotionSurface>;
}
