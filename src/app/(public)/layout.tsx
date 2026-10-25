import type { Metadata } from "next";
import { profileDescription } from "@/lib/content";
import { getPortfolio } from "@/lib/public-data";
import { Header, Footer } from "@/components/site-chrome";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { profile } = await getPortfolio();
    return { title: { default: profile ? `${profile.name} — ${profile.role}` : "Portfolio", template: profile ? `%s · ${profile.name}` : "%s · Portfolio" }, description: profileDescription(profile) };
  } catch { return { title: "Portfolio", description: "Content temporarily unavailable." }; }
}
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getPortfolio();
  return <><Header profile={profile} />{children}<Footer profile={profile} /></>;
}
