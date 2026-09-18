/**
 * How a product is written on every search-facing surface.
 *
 * Why this file exists: Search Console showed 50 model-number queries
 * (`ai16000`, `75qned72b`, `wan28219it`, …) ranking at an average position
 * of 7.1 across 762 impressions — and taking zero clicks. The pages ranked
 * fine; the SERP title said "מזגן נייד 16000 BTU" and never said "Aiwa" or
 * "AI16000", so the searcher never recognised their own model and scrolled
 * past. Everything here exists to close that gap without inflating titles.
 *
 * Rules that hold across locales:
 * - Brand and model are appended when — and only when — the product name
 *   does not already carry them. Repeating them would read as stuffing.
 * - Brand and model are never truncated. When a title runs long, the
 *   descriptive name gives way at a word boundary; the identifiers stay.
 * - Descriptions end on a sentence, never mid-word.
 */

import type { Product } from "@/types/product";
import { seoBrandName, brandAliases } from "@/lib/seo/brandNames";
import { cleanModelNumber } from "@/lib/normalize";

export type SeoLocale = "he" | "en" | "ru";

/** Short store name for titles. The legal "בע״מ" costs 5 chars and adds nothing. */
const SITE_SUFFIX: Record<SeoLocale, string> = {
  he: "חדד יובל אלקטריק",
  en: "Hadad Electric, Nahariya",
  ru: "Hadad Electric",
};

/**
 * A commercial hook appended after the identifiers.
 *
 * Russian gets "купить в Израиле" because the query export shows it on
 * almost every converting Russian query ("напольный кондиционер купить в
 * израиле", "цены на стиральные машины в израиле"). English gets a
 * geographic qualifier for the opposite reason: 1,991 English impressions
 * came from the UK, US and Netherlands on generic terms like "mini hair
 * dryer" and converted 3 times. Naming the service area filters traffic
 * this store can never serve and raises CTR on the traffic it can.
 */
const TITLE_HOOK: Record<SeoLocale, string> = {
  he: "",
  // Short enough to survive the priority ladder below, unlike the full store
  // suffix. English titles must keep a geographic signal even when trimmed:
  // the whole point is to stop competing for "mini hair dryer" in Manchester.
  en: " — Israel",
  ru: " — купить в Израиле",
};

/**
 * Google renders roughly 600px of title. Hebrew averages a little under 9px a
 * character, so 65 sits at the edge — which is fine, because the ladder below
 * puts the store name last: if anything is clipped it is the part the reader
 * already knows, never the model number.
 */
const TITLE_MAX: Record<SeoLocale, number> = { he: 65, en: 65, ru: 65 };
const DESCRIPTION_MAX = 158;
const MIN_NAME_CHARS = 18;

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9֐-׿Ѐ-ӿ]/g, "");
}

/** True when the name already carries the identifier, so appending would duplicate. */
function nameCarries(name: string, token: string | null | undefined): boolean {
  if (!token) return true;
  const needle = normalizeForMatch(token);
  if (needle.length < 2) return true;
  return normalizeForMatch(name).includes(needle);
}

/**
 * Words that cannot end a phrase.
 *
 * A length heuristic is not enough: English "with" is four characters and
 * Russian oblique prepositions are longer still, so truncation produced
 * "1000 watt food processor with a Moulinex FP825E10" — which reads as if the
 * accessory were the brand.
 */
const ORPHAN_WORDS = new Set([
  // Hebrew
  "עם", "של", "ל", "ב", "מ", "ו", "או", "עד", "בין", "כולל", "לפי", "על", "אל", "מן",
  // English
  "with", "and", "or", "for", "the", "a", "an", "of", "in", "to", "by",
  // Russian
  "с", "и", "или", "для", "из", "на", "в", "к", "по", "от", "до", "объемом", "мощностью", "со",
]);

/** Cuts at a word boundary, then removes any trailing word that cannot end a phrase. */
function truncateAtWord(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  // Compare the kept LENGTH against the minimum, not the index against it.
  let kept = cut.slice(0, lastSpace).length >= MIN_NAME_CHARS ? cut.slice(0, lastSpace) : cut;
  kept = kept.replace(/[\s,;:.\-–—]+$/, "");

  const words = kept.split(" ");
  while (words.length > 2 && ORPHAN_WORDS.has(words[words.length - 1].toLowerCase())) words.pop();
  return words.join(" ").replace(/[\s,;:.\-–—]+$/, "");
}

/**
 * The identifiers to append: brand first, then model, each only if missing.
 * Returned separately from the name so callers can protect them from truncation.
 */
export function productIdentifiers(product: Product): string {
  const brand = seoBrandName(product.brand);
  const model = cleanModelNumber(product.modelNumber);
  const parts: string[] = [];
  if (brand && !nameCarries(product.name, brand)) parts.push(brand);
  if (model && !nameCarries(product.name, model)) parts.push(model);
  return parts.join(" ");
}

/**
 * Supplier names arrive with terminal punctuation often enough that appending
 * ", Brand" produced "Nespresso., De'Longhi" in 136 Russian descriptions.
 */
function cleanName(name: string): string {
  return name.trim().replace(/[.,;:\s]+$/, "");
}

/**
 * The SERP title. Layout is `{name} {brand} {model}{hook} | {store}`, with the
 * store suffix dropped before the name is ever cut, and the name cut before
 * the identifiers are ever touched.
 */
export function productSearchTitle(product: Product, locale: SeoLocale = "he"): string {
  const max = TITLE_MAX[locale];
  const identifiers = productIdentifiers(product);
  const tail = identifiers ? ` ${identifiers}` : "";
  const hook = TITLE_HOOK[locale];
  const site = ` | ${SITE_SUFFIX[locale]}`;
  const name = cleanName(product.name);

  // Priority ladder as the budget tightens. Every step gives up the least
  // valuable thing still present: the store name first (Google re-adds it from
  // og:site_name anyway), then the commercial hook, and only then words of the
  // name. Brand and model are never given up — they are the reason a
  // model-number search recognises the result at all.
  const candidates = [
    `${name}${tail}${hook}${site}`,
    `${name}${tail}${hook}`,
    `${name}${tail}`,
  ];
  for (const candidate of candidates) {
    if (candidate.length <= max) return candidate;
  }
  // When the identifiers alone eat the budget they still win: a title one or
  // two characters over is clipped harmlessly, a title without the model
  // number is invisible to the search that would have matched it.
  const shortened = truncateAtWord(name, Math.max(MIN_NAME_CHARS, max - tail.length));
  return `${shortened}${tail}`.slice(0, Math.max(max, tail.length + MIN_NAME_CHARS));
}

const HEBREW = /[\u0590-\u05FF]/;
const CYRILLIC = /[\u0400-\u04FF]/;

/**
 * Specs and capabilities come from the supplier feed in Hebrew only — the
 * translation job covers name and description, not the spec table. So a fact
 * is usable in a locale only when its script fits: a Hebrew clause inside an
 * English snippet reads as a broken page and costs the click it was meant to win.
 * Facts that are pure numbers and Latin ("COP 2.6", "1400 RPM") pass everywhere.
 */
function factFitsLocale(fact: string, locale: SeoLocale): boolean {
  if (locale === "he") return !CYRILLIC.test(fact);
  if (locale === "ru") return !HEBREW.test(fact);
  return !HEBREW.test(fact) && !CYRILLIC.test(fact);
}

/** Splits a supplier description into clause-sized candidates. */
function descriptionClauses(description: string): string[] {
  return description
    .split(/[;·\n]+|(?<=[.!?])\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

/**
 * Short, concrete facts for a snippet — specs carrying a number first, then
 * other specs, then capabilities, then clauses of the description (the only
 * source that exists in translated form for `en`/`ru`). A fact already stated
 * in the product name is skipped so the description adds information rather
 * than echoing the title.
 */
export function productFacts(
  product: Product,
  options?: { maxChars?: number; maxCount?: number; locale?: SeoLocale }
): string[] {
  const maxChars = options?.maxChars ?? 44;
  const maxCount = options?.maxCount ?? 2;
  const locale = options?.locale ?? "he";
  const seen = new Set<string>();
  const nameNormalized = normalizeForMatch(product.name);
  const picked: string[] = [];

  const consider = (raw: string) => {
    if (picked.length >= maxCount) return;
    const fact = raw.trim().replace(/[.;,]+$/, "");
    if (!fact || fact.length > maxChars || fact.length < 4) return;
    if (!factFitsLocale(fact, locale)) return;
    const normalized = normalizeForMatch(fact);
    if (!normalized || seen.has(normalized)) return;
    if (normalized.length > 6 && nameNormalized.includes(normalized)) return;
    seen.add(normalized);
    picked.push(fact);
  };

  const numeric = product.specs.filter((spec) => /\d/.test(spec.value));
  for (const spec of numeric) consider(spec.label ? `${spec.label} ${spec.value}` : spec.value);
  for (const spec of product.specs) consider(spec.label ? `${spec.label} ${spec.value}` : spec.value);
  for (const capability of product.capabilities) consider(capability);
  for (const clause of descriptionClauses(product.description)) consider(clause);

  return picked;
}

interface SnippetCopy {
  modelWord: string;
  cta: string;
  join: string;
}

const SNIPPET: Record<SeoLocale, SnippetCopy> = {
  he: {
    modelWord: "דגם",
    cta: "בדיקת זמינות ומחיר בוואטסאפ · משלוח והתקנה בנהריה ובכל הצפון.",
    join: ", ",
  },
  en: {
    modelWord: "model",
    cta: "Availability and price by WhatsApp · delivery and installation across Northern Israel.",
    join: ", ",
  },
  ru: {
    modelWord: "модель",
    cta: "Наличие и цена по WhatsApp · доставка и установка в Нагарии и на севере Израиля.",
    join: ", ",
  },
};

/**
 * The opening clause of an expert note, trimmed to the space a snippet has
 * left. Returns "" when there is no note or no room for a readable one — a
 * three-word stub helps nobody, so the spec facts keep the slot instead.
 */
function expertNoteClause(note: string | null, maxChars: number): string {
  if (!note || maxChars <= 24) return "";
  const opener = note.split(/(?<=[.!?])\s+|[;·\n]/)[0]?.trim().replace(/[.;,]+$/, "");
  if (!opener || opener.length <= 12) return "";
  return opener.length <= maxChars ? opener : truncateAtWord(opener, maxChars);
}

/**
 * The meta description. Identity first (so a model-number searcher sees their
 * model), then whatever concrete facts fit, then the one thing this store
 * offers that a price-comparison site cannot: a local person and an installer.
 */
export function productMetaDescription(product: Product, locale: SeoLocale = "he"): string {
  const copy = SNIPPET[locale];
  const brand = seoBrandName(product.brand);

  // Identifiers are fixed cost, exactly as in the title: a snippet that ends
  // "…, Haier, model." because the model was truncated away is worse than one
  // with a shorter name, and it is the model the searcher is scanning for.
  const model = cleanModelNumber(product.modelNumber);
  const identifiers = [brand, model ? `${copy.modelWord} ${model}` : ""]
    .filter(Boolean)
    .map((part) => `, ${part}`)
    .join("");

  const budget = DESCRIPTION_MAX - copy.cta.length - 2;
  const nameBudget = budget - identifiers.length - 1;
  const name = cleanName(product.name);
  const head = `${nameBudget >= MIN_NAME_CHARS && name.length > nameBudget ? truncateAtWord(name, nameBudget) : name}${identifiers}`;

  const remaining = budget - head.length - 2;

  // Yuval's note outranks the spec fragments for the middle of the snippet.
  // Against nine results carrying the same importer feed, "נפח: 470 ליטר"
  // distinguishes nothing — every one of them says it. An original clause
  // written by a person at the shop is the only part of this result a
  // competitor cannot also show, and the snippet is where that difference
  // is actually seen. Hebrew only: the note has no translation yet, and
  // `factFitsLocale` rightly rejects Hebrew on the en/ru pages.
  let factText = locale === "he" ? expertNoteClause(product.expertNote, remaining) : "";

  const facts = !factText && remaining > 14 ? productFacts(product, { maxChars: Math.min(44, remaining), locale }) : [];
  for (const fact of facts) {
    const candidate = factText ? `${factText}${copy.join}${fact}` : fact;
    if (candidate.length <= remaining) factText = candidate;
  }

  // The spec table is Hebrew-only in the supplier feed, so `factFitsLocale`
  // rejects all of it on an English or Russian page — which left roughly 97%
  // of those snippets identical after the product name. The translated
  // description is the one localized source available, so when nothing else
  // survives, take its opening clause and trim it to fit.
  if (!factText && remaining > 24) {
    const opener = product.description.split(/(?<=[.!?])\s+|[;·\n]/)[0]?.trim().replace(/[.;,]+$/, "");
    if (opener && factFitsLocale(opener, locale) && opener.length > 12) {
      factText = opener.length <= remaining ? opener : truncateAtWord(opener, remaining);
    }
  }

  return [`${head}.`, factText ? `${factText}.` : "", copy.cta].filter(Boolean).join(" ");
}

/**
 * Heading for the product page. The H1 needs the identifiers for the same
 * reason the title does — an AI answer engine quoting the page should be able
 * to say which model it is looking at without parsing a spec table.
 */
export function productHeading(product: Product): string {
  const identifiers = productIdentifiers(product);
  return identifiers ? `${product.name} ${identifiers}` : product.name;
}

/**
 * Hebrew/Russian spellings of the brand, for body copy where there is room.
 * Titles deliberately carry one spelling only.
 */
export function localizedBrandLabel(product: Product, locale: SeoLocale): string | null {
  const brand = seoBrandName(product.brand);
  if (!brand) return null;
  const alias = brandAliases(product.brand, locale)[0];
  return alias ? `${brand} (${alias})` : brand;
}
