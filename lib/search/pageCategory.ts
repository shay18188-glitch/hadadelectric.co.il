import type { Locale } from "@/lib/i18n/locales";

/**
 * The product category a page is about, so the smart-search sheet can open
 * with a one-tap route into that category ("all ovens") instead of a blank
 * box. Client-safe on purpose: it reads only the URL, never the guide
 * content, so it adds nothing to the client bundle.
 */
export interface PageCategory {
  slug: string;
  label: string;
}

const CATEGORY_LABELS: Record<string, Record<Locale, string>> = {
  refrigerators: { he: "מקררים", en: "Refrigerators", ru: "Холодильники" },
  freezers: { he: "מקפיאים", en: "Freezers", ru: "Морозильники" },
  "washing-machines": { he: "מכונות כביסה", en: "Washing machines", ru: "Стиральные машины" },
  dryers: { he: "מייבשי כביסה", en: "Dryers", ru: "Сушильные машины" },
  dishwashers: { he: "מדיחי כלים", en: "Dishwashers", ru: "Посудомоечные машины" },
  ovens: { he: "תנורים", en: "Ovens", ru: "Духовые шкафы" },
  cooktops: { he: "כיריים", en: "Cooktops", ru: "Варочные панели" },
  microwaves: { he: "מיקרוגלים", en: "Microwaves", ru: "Микроволновки" },
  tvs: { he: "טלוויזיות", en: "TVs", ru: "Телевизоры" },
  "air-conditioners": { he: "מזגנים", en: "Air conditioners", ru: "Кондиционеры" },
  "vacuum-cleaners": { he: "שואבי אבק", en: "Vacuum cleaners", ru: "Пылесосы" },
};

// Ordered: "dishwasher" must win over "washer", and "refrigerator" over
// "freezer" ("refrigerator-4-door-vs-bottom-freezer" is a fridge page).
const SLUG_KEYWORDS: ReadonlyArray<[RegExp, string]> = [
  [/dishwasher/, "dishwashers"],
  [/washing-machine|washer/, "washing-machines"],
  [/dryer/, "dryers"],
  [/refrigerator|fridge/, "refrigerators"],
  [/freezer/, "freezers"],
  [/microwave/, "microwaves"],
  [/oven|built-in|range/, "ovens"],
  [/cooktop|hob/, "cooktops"],
  [/(^|-)tvs?(-|$)|television/, "tvs"],
  [/air-condition/, "air-conditioners"],
  [/vacuum/, "vacuum-cleaners"],
];

/** `basePath` is the path without its /en or /ru prefix. */
export function pageCategoryFromPath(basePath: string, locale: Locale): PageCategory | null {
  const [, section, slug] = basePath.split("/");
  if (!section || !slug) return null;

  let categorySlug: string | null = null;
  if (section === "categories") {
    categorySlug = decodeURIComponent(slug);
  } else if (section === "guides" || section === "recommended") {
    categorySlug = SLUG_KEYWORDS.find(([pattern]) => pattern.test(slug))?.[1] ?? null;
  }

  const labels = categorySlug ? CATEGORY_LABELS[categorySlug] : undefined;
  if (!categorySlug || !labels) return null;
  return { slug: categorySlug, label: labels[locale] };
}
