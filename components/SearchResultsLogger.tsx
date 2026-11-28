"use client";

import { useEffect } from "react";
import { logSearch } from "@/lib/analytics";

/**
 * Logs a full results-page search once per query, with the real result
 * count the shopper saw. Renders nothing.
 */
export function SearchResultsLogger({ query, count, corrected }: { query: string; count: number; corrected: string | null }) {
  useEffect(() => {
    const key = `hy_sq:${query}`;
    try {
      // A refresh or back-navigation is the same search, not a new one.
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage unavailable: log anyway.
    }
    logSearch({ q: query, n: count, o: "results_page", s: "results_page", c: corrected });
  }, [query, count, corrected]);
  return null;
}
