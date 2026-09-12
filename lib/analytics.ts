"use client";

import { markConversionIntent } from "@/lib/conversion-intent";
import { landingTypeFromPath, sourceFromReferrer, type LandingType, type TrafficSource } from "@/lib/analytics/landing";

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
  | "brand_view"
  | "bundle_view"
  | "bundle_add_to_request"
  | "exit_offer_view"
  | "exit_offer_submit"
  | "exit_offer_whatsapp"
  | "exit_offer_dismiss";

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
  "bundle_view",
  "bundle_add_to_request",
  "exit_offer_view",
  "exit_offer_submit",
  "exit_offer_whatsapp",
  "exit_offer_dismiss",
]);

/**
 * Sends a business event to our own /api/track collector without blocking the
 * page: navigator.sendBeacon queues it and returns immediately (falls back to
 * a keepalive fetch). Silently does nothing if unavailable.
 */
/**
 * The template this visit started on and the channel it came from, captured
 * once and reused for every enquiry in the session.
 *
 * It has to be recorded on the first page, because by the time someone clicks
 * WhatsApp they may be three pages deep and `document.referrer` is long gone.
 * sessionStorage scopes it to the visit and leaves nothing behind afterwards;
 * both values are drawn from closed allow-lists, so nothing identifying is
 * stored and nothing free-form is ever sent.
 */
const VISIT_KEY = "hy_visit";

function visitContext(): { landing?: LandingType; source?: TrafficSource } {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.sessionStorage.getItem(VISIT_KEY);
    if (stored) return JSON.parse(stored) as { landing: LandingType; source: TrafficSource };
    const context = {
      landing: landingTypeFromPath(window.location.pathname),
      source: sourceFromReferrer(document.referrer || "", window.location.hostname),
    };
    window.sessionStorage.setItem(VISIT_KEY, JSON.stringify(context));
    return context;
  } catch {
    // Private mode, or storage disabled: attribution is simply absent.
    return {};
  }
}

function sendServerBeacon(event: AnalyticsEvent, params: Record<string, unknown>): void {
  if (!SERVER_TRACKED.has(event)) return;
  try {
    const slug = typeof params.slug === "string" ? params.slug : undefined;
    const category = typeof params.category === "string" ? params.category : undefined;
    const { landing, source } = visitContext();
    const body = JSON.stringify({ events: [{ event, slug, category, landing, source }] });
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
  if (event.startsWith("whatsapp_click") || event === "exit_offer_whatsapp") {
    markConversionIntent("whatsapp");
  } else if (event === "phone_click") {
    markConversionIntent("phone");
  } else if (event === "contact_form_submit" || event === "exit_offer_submit") {
    markConversionIntent("form_submit");
  }
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
