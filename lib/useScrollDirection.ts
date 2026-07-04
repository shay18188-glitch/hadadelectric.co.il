"use client";

import { useEffect, useRef, useState } from "react";

export interface ScrollState {
  direction: "up" | "down";
  atTop: boolean;
}

const INITIAL_STATE: ScrollState = { direction: "up", atTop: true };

/**
 * Lightweight, rAF-throttled scroll-direction tracker used to drive the
 * floating header's hide-on-scroll-down / show-on-scroll-up behavior.
 * Uses a passive listener and a single requestAnimationFrame per frame,
 * so it stays cheap and doesn't hurt scroll performance / Core Web Vitals.
 */
export function useScrollDirection(threshold = 6): ScrollState {
  const [state, setState] = useState<ScrollState>(INITIAL_STATE);
  const lastY = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    function measure() {
      frame.current = 0;
      const y = window.scrollY;
      const diff = y - lastY.current;

      if (y < 8) {
        lastY.current = y;
        setState((prev) => (prev.atTop && prev.direction === "up" ? prev : { direction: "up", atTop: true }));
        return;
      }

      if (Math.abs(diff) < threshold) return;

      const direction = diff > 0 ? "down" : "up";
      lastY.current = y;
      setState((prev) => (prev.direction === direction && !prev.atTop ? prev : { direction, atTop: false }));
    }

    function onScroll() {
      if (frame.current) return;
      frame.current = requestAnimationFrame(measure);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [threshold]);

  return state;
}
