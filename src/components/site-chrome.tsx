import Link from "next/link";
import { initials, type Profile } from "@/lib/content";
import { Arrow } from "./icons";
import { ScrollProgress } from "./scroll-progress";

export function Header({ profile, preview = false }: { profile: Profile | null; preview?: boolean }) {
  const home = preview ? "/admin/preview" : "/";
  return <header className="site-header"><div className="shell header-inner">
    <Link className="brand" href={home} aria-label={`${profile?.name ?? "Portfolio"} home`}><span className="brand-mark">{profile?.brandMark || initials(profile?.name ?? "Portfolio")}<i>.</i></span><span className="brand-name">{profile?.name ?? "Portfolio"}</span></Link>
    <nav aria-label="Main navigation"><Link href={`${home}#experience`}>Experience</Link><Link href={preview ? `${home}#work` : "/projects"}>Work</Link><Link href={`${home}#expertise`}>Expertise</Link><Link className="nav-contact" href={`${home}#contact`}>Let’s connect <Arrow diagonal /></Link></nav>
  </div><ScrollProgress /></header>;
}
export function Footer({ profile }: { profile: Profile | null }) {
  return <footer className="site-footer shell"><span>© {new Date().getFullYear()} {profile?.name ?? "Portfolio"}</span><span>Built with purpose. Always evolving.</span><a href="#top">Back to top ↑</a></footer>;
}
export function Contact({ profile }: { profile: Profile }) {
  return <section id="contact" className="contact-section shell"><div><p className="eyebrow"><span className="small-dot" /> Get in touch</p><h2>Good work starts with<br /><span className="muted">a conversation.</span></h2><p>Have an interesting problem or an idea to explore?</p></div><div className="contact-links">{profile.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}<Arrow diagonal /></a>)}{profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">Résumé <Arrow diagonal /></a>}</div></section>;
}
