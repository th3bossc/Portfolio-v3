import type { Metadata } from "next";
import { siteUrl } from "@/lib/public-data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Portfolio", template: "%s · Portfolio" },
  description: "Selected work and experience.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body id="top"><a href="#main" className="skip-link">Skip to content</a>{children}</body></html>;
}
