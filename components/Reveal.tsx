"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  as?: "div" | "section";
  className?: string;
  /** Reveal all direct children with a staggered delay instead of the wrapper itself. */
  stagger?: boolean;
  /** Extra delay steps (60ms each) — useful for grids rendered further down the page. */
  delay?: number;
}

/**
 * Cheap, dependency-free reveal-on-scroll: a single IntersectionObserver per
 * instance flips one class once, then disconnects. No layout thrashing, no
 * scroll listeners, and it fully respects `prefers-reduced-motion` (handled
 * in globals.css) so it never fights accessibility settings or Core Web Vitals.
 */
export function Reveal({ children, as = "div", className, stagger = false, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const combinedClassName = cx(stagger ? "reveal-stagger" : "reveal", className);
  const style = delay ? ({ "--reveal-delay": delay } as CSSProperties) : undefined;

  if (as === "section") {
    return (
      <section ref={ref as never} className={combinedClassName} style={style}>
        {children}
      </section>
    );
  }

  return (
    <div ref={ref as never} className={combinedClassName} style={style}>
      {children}
    </div>
  );
}
