// Canonical site origin. Always HTTPS and without a trailing slash, so every
// URL we emit (canonical, hreflang, sitemap, JSON-LD) is well-formed.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hadadelectric.co.il")
  .replace(/\/$/, "")
  .replace(/^http:\/\//i, "https://");

export function absoluteUrl(path: string): string {
  // Defensive: if an already-absolute URL is passed in, return it as-is (forced
  // to HTTPS) instead of prefixing the origin — which would produce a broken
  // doubled path like https://hadadelectric.co.il/https://hadadelectric.co.il.
  if (/^https?:\/\//i.test(path)) return path.replace(/^http:\/\//i, "https://");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const BUSINESS = {
  nameHe: "חדד יובל אלקטריק בע״מ",
  nameEn: "Hadad Electric",
  addressStreet: "לוחמי הגטאות 3",
  addressCity: "נהריה",
  phoneDisplay: "04-9920948",
  phoneHref: "tel:049920948",
  mobileDisplay: "052-2692235",
  facebookUrl: "https://www.facebook.com/Hadad.Electric",
} as const;

/**
 * The person product notes are attributed to.
 *
 * Lives here rather than in the component that renders the byline because
 * the structured data has to make the identical claim — a visible author the
 * markup does not name, or a markup author the page never shows, is the
 * mismatch that makes authorship markup worthless.
 */
export const EXPERT = {
  nameHe: "יובל חדד",
  nameEn: "Yuval Hadad",
  initialsHe: "יח",
  roleHe: "בעל החנות ויועץ מקצועי",
  roleEn: "Shop owner and appliance advisor",
  roleRu: "Владелец магазина и консультант",
} as const;
