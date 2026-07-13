/**
 * Real Google Business Profile rating for חדד יובל אלקטריק בע״מ.
 * Values are taken from the live Google profile and must stay truthful —
 * update them here when the profile changes. We display the aggregate score
 * only (no review text) and deliberately do NOT emit aggregateRating
 * structured data: Google disallows self-serving review markup for a
 * LocalBusiness on its own site. This is a visual trust signal that links
 * out to the genuine reviews on Google.
 */
export const GOOGLE_REVIEWS = {
  rating: 4.8,
  count: 20,
  /** Stable Maps deep-link to the business profile (feature id, not session-bound). */
  url: "https://www.google.com/maps?ftid=0x151dce58ddf47767:0x3d9768238086ce41",
} as const;

export interface BusinessProfile {
  name: string;
  url: string;
}

/**
 * External business listings / citations. Keeping consistent NAP across these
 * strengthens local trust signals, and gives customers more ways to find us.
 */
export const BUSINESS_PROFILES: BusinessProfile[] = [
  { name: "Google", url: GOOGLE_REVIEWS.url },
  { name: "פייסבוק", url: "https://www.facebook.com/Hadad.Electric/" },
  { name: "דפי זהב", url: "https://www.d.co.il/24391800/17850/" },
  { name: "B144", url: "https://www.b144.co.il/b144_sip/401C04134072605B4B150717/" },
  { name: "easy", url: "https://easy.co.il/en/page/5170642" },
];
