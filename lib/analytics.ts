"use client";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | "whatsapp_click_header"
  | "whatsapp_click_product"
  | "whatsapp_click_basket"
  | "phone_click"
  | "product_view"
  | "product_add_to_request"
  | "product_remove_from_request"
  | "search_query"
  | "filter_use"
  | "contact_form_submit"
  | "category_view"
  | "brand_view";

/** Events also persisted to our own server-side counters (for the admin BI). */
const SERVER_TRACKED: ReadonlySet<AnalyticsEvent> = new Set([
  "product_view",
  "category_view",
  "brand_view",
  "whatsapp_click_header",
  "whatsapp_click_product",
  "whatsapp_click_basket",
  "phone_click",
  "search_query",
  "contact_form_submit",
  "product_add_to_request",
]);

/**
 * Sends a business event to our own /api/track collector without blocking the
 * page: navigator.sendBeacon queues it and returns immediately (falls back to
 * a keepalive fetch). Silently does nothing if unavailable.
 */
function sendServerBeacon(event: AnalyticsEvent, params: Record<string, unknown>): void {
  if (!SERVER_TRACKED.has(event)) return;
  try {
    const slug = typeof params.slug === "string" ? params.slug : undefined;
    const category = typeof params.category === "string" ? params.category : undefined;
    const body = JSON.stringify({ events: [{ event, slug, category }] });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // Tracking must never break the UX.
  }
}

/**
 * Fires a GA4/GTM event if analytics is configured, and mirrors business
 * events to our own lightweight server collector — without affecting
 * performance or throwing when neither is configured.
 */
export function trackEvent(event: AnalyticsEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...params });
    }
  } catch {
    // Never let analytics break the UX.
  }
  sendServerBeacon(event, params);
}
