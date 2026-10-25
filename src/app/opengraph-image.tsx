import { ImageResponse } from "next/og";
import { getPortfolio } from "@/lib/public-data";
export const dynamic = "force-dynamic";
export const alt = "Portfolio overview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  let profile = null;
  try { profile = (await getPortfolio()).profile; } catch { /* Neutral image during a database outage. */ }
  return new ImageResponse(<div style={{ background: "#111415", color: "#eaece8", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", fontFamily: "sans-serif" }}><div style={{ display: "flex", fontSize: 26, color: "#8dd5c4", letterSpacing: 3 }}>{profile?.name || "Portfolio"}</div><div style={{ fontSize: 60, display: "flex", lineHeight: 1.15, maxWidth: 1056 }}>{profile?.headline || "Selected work and experience."}</div><div style={{ display: "flex", borderTop: "1px solid #384441", paddingTop: 25, fontSize: 23 }}>{profile?.supportingLine || profile?.role || ""}</div></div>, size);
}
