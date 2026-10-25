import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolio } from "@/lib/public-data";
import { ProjectDetail } from "@/components/projects";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = (await getPortfolio()).projects.find((entry) => entry.slug === slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  return { title: project.title, description: project.summary, alternates: { canonical: `/projects/${slug}` }, openGraph: { title: project.title, description: project.summary, url: `/projects/${slug}`, ...(project.imageUrl ? { images: [project.imageUrl] } : {}) } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = (await getPortfolio()).projects.find((entry) => entry.slug === slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
