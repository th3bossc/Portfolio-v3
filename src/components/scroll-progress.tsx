"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const remaining = root.scrollHeight - root.clientHeight;
      const progress = remaining > 0 ? Math.min(1, Math.max(0, window.scrollY / remaining)) : 0;
      element.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Only replace the native scrollbar when the working indicator is mounted.
    root.dataset.scrollProgress = "true";
    update();
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.scrollProgress;
    };
  }, [pathname]);

  return <div ref={bar} className="nav-scroll-progress" aria-hidden="true" />;
}
