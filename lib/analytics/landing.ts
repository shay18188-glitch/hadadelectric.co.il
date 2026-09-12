/**
 * Where the visit started, in two low-cardinality dimensions.
 *
 * The admin dashboard can already say a page was viewed 1,000 times and that
 * WhatsApp was clicked 40 times. It cannot say which kind of page produced the
 * enquiry, which is the question worth answering: Search Console shows category
 * pages converting at 3.25% against 2.00% for product pages, and 82% of clicks
 * arriving on queries too rare for Console to name. Attribution has to come
 * from the site's own data or not at all.
 *
 * Both dimensions are deliberately coarse. The landing page is bucketed by
 * template rather than stored as a path, and the source is bucketed by engine
 * rather than stored as a referrer — enough to answer "which content earns
 * enquiries", small enough to read at a glance, and holding nothing that
 * identifies a visitor. Search engines strip the query from the referrer, so
 * the actual search terms are not available here and are not guessed at.
 *
 * Client-safe: no imports, pure functions, shared by the browser and the
 * collector so both agree on the allowed values.
 */

export const LANDING_TYPES = [
  "home",
  "product",
  "category",
  "guide",
  "local",
  "recommended",
  "brand",
  "bundle",
  "tool",
  "request",
  "other",
] as const;
export type LandingType = (typeof LANDING_TYPES)[number];

export const TRAFFIC_SOURCES = ["google", "bing", "ai", "social", "referral", "direct"] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

const LANDING_RULES: [RegExp, LandingType][] = [
  [/^\/(en|ru)?\/?$/, "home"],
  [/^\/(en|ru)\/products\/[^/]+/, "product"],
  [/^\/products\/[^/]+/, "product"],
  [/^\/(en|ru)\/categories\/[^/]+/, "category"],
  [/^\/categories\/[^/]+/, "category"],
  [/^\/(en|ru)\/guides\/[^/]+/, "guide"],
  [/^\/guides\/[^/]+/, "guide"],
  [/^\/(en\/|ru\/)?electric-appliances-/, "local"],
  [/^\/recommended\//, "recommended"],
  [/^\/brands\//, "brand"],
  [/^\/bundles\//, "bundle"],
  [/^\/tools\//, "tool"],
  [/^\/request/, "request"],
];

export function landingTypeFromPath(pathname: string): LandingType {
  const path = (pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";
  for (const [re, type] of LANDING_RULES) {
    if (re.test(path)) return type;
  }
  return "other";
}

export function sourceFromReferrer(referrer: string, ownHost: string): TrafficSource {
  if (!referrer) return "direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (ownHost && (host === ownHost || host.endsWith(`.${ownHost}`))) return "direct";
  if (/(^|\.)google\./.test(host)) return "google";
  if (/(^|\.)(bing|msn)\./.test(host) || host.includes("duckduckgo")) return "bing";
  if (/(chatgpt|openai|perplexity|claude\.ai|copilot|gemini)/.test(host)) return "ai";
  if (/(facebook|instagram|t\.co|twitter|x\.com|linkedin|whatsapp|tiktok)/.test(host)) return "social";
  return "referral";
}

export function isLandingType(x: unknown): x is LandingType {
  return typeof x === "string" && (LANDING_TYPES as readonly string[]).includes(x);
}

export function isTrafficSource(x: unknown): x is TrafficSource {
  return typeof x === "string" && (TRAFFIC_SOURCES as readonly string[]).includes(x);
}
