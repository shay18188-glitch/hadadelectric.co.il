import { stripLocalePrefix } from "@/lib/i18n/locales";

const INTENT_KEY = "hadad:conversion-intent";
const EXIT_OFFER_KEY = "hadad:exit-offer-shown-at";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FORM_AND_SYSTEM_PATHS = new Set([
  "/contact",
  "/request",
  "/terms",
  "/privacy-policy",
  "/accessibility",
  "/thank-you",
  "/thankyou",
  "/thanks",
]);

export const CONVERSION_INTENT_EVENT = "hadad:conversion-intent";

export type ConversionIntentReason =
  | "whatsapp"
  | "phone"
  | "form_open"
  | "form_submit";

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Remember that this visitor already chose a direct contact path. */
export function markConversionIntent(reason: ConversionIntentReason): void {
  if (typeof window === "undefined") return;
  try {
    if (storageAvailable()) {
      window.localStorage.setItem(INTENT_KEY, JSON.stringify({ reason, at: Date.now() }));
    }
  } catch {
    // Privacy modes may block storage; the in-page event still suppresses UI.
  }
  window.dispatchEvent(new CustomEvent(CONVERSION_INTENT_EVENT, { detail: { reason } }));
}

export function hasConversionIntent(): boolean {
  try {
    return storageAvailable() && Boolean(window.localStorage.getItem(INTENT_KEY));
  } catch {
    return false;
  }
}

export function rememberExitOfferShown(): void {
  try {
    if (storageAvailable()) window.localStorage.setItem(EXIT_OFFER_KEY, String(Date.now()));
  } catch {
    // Showing the offer must never depend on storage availability.
  }
}

export function wasExitOfferShownRecently(now = Date.now()): boolean {
  try {
    if (!storageAvailable()) return false;
    const shownAt = Number(window.localStorage.getItem(EXIT_OFFER_KEY));
    return Number.isFinite(shownAt) && shownAt > 0 && now - shownAt < SEVEN_DAYS_MS;
  } catch {
    return false;
  }
}

/**
 * Pages where proactive conversion UI would be redundant or inappropriate:
 * active forms, thank-you/admin/legal screens and dedicated campaign/SEO landers.
 */
export function shouldExcludeConversionUi(pathname: string): boolean {
  const path = stripLocalePrefix(pathname || "/");
  if (FORM_AND_SYSTEM_PATHS.has(path)) return true;
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/electric-appliances-") ||
    path.startsWith("/campaign") ||
    path.startsWith("/landing") ||
    path.startsWith("/lp/")
  );
}

/** Persistent call/WhatsApp bars stay useful on campaign pages. */
export function shouldExcludePersistentCta(pathname: string): boolean {
  const path = stripLocalePrefix(pathname || "/");
  return FORM_AND_SYSTEM_PATHS.has(path) || path.startsWith("/admin") || path.startsWith("/api");
}
