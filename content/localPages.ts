import { CORE_AREA_PAGES } from "@/content/localPages.core";
import { GALILEE_AREA_PAGES } from "@/content/localPages.galilee";
import { EAST_VALLEY_AREA_PAGES } from "@/content/localPages.east";

export interface LocalPageFaqItem {
  question: string;
  answer: string;
}

/** A category highlighted for a specific city, with a short local context sentence. */
export interface LocalPageCategoryHighlight {
  slug: string;
  name: string;
  note: string;
}

export interface LocalPageLink {
  path: string;
  label: string;
}

export interface LocalPageContent {
  path: string;
  /** Display name of the city/area, e.g. "כרמיאל" */
  city: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Unique local opening paragraphs — travel time, routes, neighbourhoods, what locals order. */
  intro: string[];
  whyUsHeading: string;
  whyUs: string[];
  /** How ordering works for this city (catalog → WhatsApp → delivery/pickup coordination). */
  howItWorks: string[];
  /** 4–6 categories relevant to this city's angle, each with a local context sentence. */
  topCategories: LocalPageCategoryHighlight[];
  faq: LocalPageFaqItem[];
  areasServed: string[];
  /** Nearby area pages for internal linking. */
  nearby: LocalPageLink[];
  /** Related buying guides. */
  relatedGuides: LocalPageLink[];
}

export const LOCAL_PAGES: LocalPageContent[] = [
  ...CORE_AREA_PAGES,
  ...GALILEE_AREA_PAGES,
  ...EAST_VALLEY_AREA_PAGES,
];

export function getLocalPageByPath(path: string): LocalPageContent | null {
  return LOCAL_PAGES.find((p) => p.path === path) ?? null;
}
