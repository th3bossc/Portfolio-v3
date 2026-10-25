"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

/** CSS supplies first-paint states and a fail-open reveal; Motion takes over when ready. */
export function MotionSurface({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const scope = root.current;
    if (!scope || reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];
    const controls = new Set<{ complete: () => void }>();
    const targets = Array.from(scope.querySelectorAll<HTMLElement>(
      "[data-hero], .section-heading, .about-copy, .approach-grid, .skills-grid, .contact-section, .project-card-copy, .project-row, .detail-body, .pipeline-node, .pipeline-connector, .browser-window, .query-bubble, .answer-lines, .document-stack, .recap-arrow, .summary-sheet"
    ));

    // Load the small WAAPI animation engine after content has rendered.
    import("motion/mini").then(({ animate }) => {
      if (disposed) return;
      // Never rewind content if the CSS fallback has already started revealing it.
      const pending = targets.filter((el) => !el.dataset.motionDone);
      const canReveal = pending.length > 0 && pending.every((el) => getComputedStyle(el).opacity === "0");
      if (canReveal) scope.dataset.motionReady = "true";
      function enter(element: Element, delay = 0, transform = ["translateY(16px)", "translateY(0px)"]) {
        if (!canReveal || !(element instanceof HTMLElement) || element.dataset.motionDone) return;
        element.dataset.motionDone = "true";
        const control = animate(element, { opacity: [0, 1], transform }, { duration: 0.44, delay, ease: [0.22, 1, 0.36, 1] });
        controls.add(control);
        void control.then(() => controls.delete(control));
      }
      scope.querySelectorAll<HTMLElement>("[data-hero]").forEach((el) => enter(el, Number(el.dataset.hero) * 0.09));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          if (target.matches(".project-visual")) {
            const steps = target.matches(".server-visual") ? ".pipeline-node, .pipeline-connector" : target.matches(".query-visual") ? ".browser-window, .query-bubble, .answer-lines" : ".document-stack, .recap-arrow, .summary-sheet";
            target.querySelectorAll(steps).forEach((step, i) => {
              const rotation = step.matches(".document-stack") ? " rotate(-6deg)" : step.matches(".summary-sheet") ? " rotate(5deg)" : "";
              enter(step, i * 0.14, [`translateY(12px)${rotation}`, `translateY(0px)${rotation}`]);
            });
          } else enter(target);
        });
      }, { threshold: 0.12 });
      scope.querySelectorAll(".section-heading, .about-copy, .approach-grid, .skills-grid, .contact-section, .project-card-copy, .project-row, .detail-body, .project-visual").forEach((el) => observer.observe(el));
      cleanups.push(() => observer.disconnect());

      scope.querySelectorAll<HTMLElement>(".project-card").forEach((card) => {
        let hover: ReturnType<typeof animate> | undefined;
        const move = (y: number) => {
          hover?.stop();
          hover = animate(card, { transform: `translateY(${y}px)` }, { duration: 0.2 });
        };
        const over = (event: PointerEvent) => { if (event.pointerType === "mouse") move(-4); };
        const out = () => move(0);
        card.addEventListener("pointerenter", over);
        card.addEventListener("pointerleave", out);
        cleanups.push(() => { card.removeEventListener("pointerenter", over); card.removeEventListener("pointerleave", out); hover?.stop(); card.style.removeProperty("transform"); });
      });

      const list = scope.querySelector<HTMLElement>(".experience-list");
      const line = list?.querySelector<HTMLElement>(".experience-track > span");
      if (canReveal && list && line) {
        let frame = 0;
        const draw = () => {
          frame = 0;
          const bounds = list.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.8 - bounds.top) / Math.max(1, bounds.height)));
          line.style.transform = `scaleY(${progress})`;
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        draw();
        cleanups.push(() => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); line.style.removeProperty("transform"); });
      }
    }).catch(() => { /* A failed optional animation download leaves all content readable. */ });
    return () => {
      disposed = true;
      controls.forEach((control) => control.complete());
      cleanups.forEach((cleanup) => cleanup());
      // An interrupted effect must not leave off-screen content concealed.
      if (scope.dataset.motionReady) {
        targets.forEach((el) => { el.dataset.motionDone = "true"; });
        delete scope.dataset.motionReady;
      }
    };
  }, [reduced, children]);

  return <div ref={root} className="motion-surface">{children}</div>;
}
