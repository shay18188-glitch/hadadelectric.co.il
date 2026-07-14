"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Fires a single view event (product/category/brand) once on mount. Renders
 * nothing. The event flows through trackEvent → GA4 + our /api/track beacon,
 * so it is fully non-blocking.
 */
export function ViewTracker({
  event,
  slug,
  category,
}: {
  event: Extract<AnalyticsEvent, "product_view" | "category_view" | "brand_view">;
  slug?: string;
  category?: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, { slug, category });
  }, [event, slug, category]);
  return null;
}
