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

/**
 * Fires a GA4/GTM event if analytics is configured, without affecting
 * performance or throwing when it isn't (privacy-friendly no-op by default).
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
}
