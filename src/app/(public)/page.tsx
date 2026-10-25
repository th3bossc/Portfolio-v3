import { profileDescription } from "@/lib/content";
import type { Metadata } from "next";
import { Home } from "@/components/home";
import { getPortfolio } from "@/lib/public-data";
export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolio();
  return { title: { absolute: profile ? `${profile.name} — ${profile.role}` : "Portfolio" }, description: profileDescription(profile), alternates: { canonical: "/" }, openGraph: { title: profile?.name, description: profileDescription(profile), url: "/", type: "website" } };
}
export default async function Page() { return <Home data={await getPortfolio()} />; }
