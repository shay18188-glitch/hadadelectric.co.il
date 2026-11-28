/**
 * The names shoppers actually type, kept as data in
 * content/search-aliases.json so research and the weekly search review can
 * extend them without touching code:
 *
 * - brands:     brand slug → spellings ("ninja" → נינג'ה, נינגה, ...)
 * - categories: catalog category name → everyday names in he/en/ru/ar
 * - products:   model number → series / marketing names ("Foodi", "Bespoke")
 * - phrases:    colloquial query → catalog phrase, scoped to one category
 * - rewrites:   single-word spelling fixes the algorithms cannot infer
 * - stopWords:  extra words that never have to appear in a result
 *
 * Server-side only: the JSON is too large for client bundles.
 */
import aliasFile from "@/content/search-aliases.json";
import { normalizeHebrewSearch } from "@/lib/search/normalizeHebrew";

export interface SearchPhrase {
  query: string;
  means: string;
  category: string;
}

export interface SearchAliasData {
  brands: Record<string, string[]>;
  categories: Record<string, string[]>;
  products: Record<string, string[]>;
  phrases: SearchPhrase[];
  rewrites: Record<string, string>;
  stopWords: string[];
}

const data = aliasFile as unknown as SearchAliasData;

function normalizedList(values: string[] | undefined): string[] {
  return Array.from(new Set((values ?? []).map(normalizeHebrewSearch).filter((value) => value.length >= 2)));
}

function normalizedKeyMap(record: Record<string, string[]> | undefined, keyFn: (key: string) => string) {
  const out = new Map<string, string[]>();
  for (const [key, values] of Object.entries(record ?? {})) {
    const normalizedKey = keyFn(key);
    out.set(normalizedKey, Array.from(new Set([...(out.get(normalizedKey) ?? []), ...normalizedList(values)])));
  }
  return out;
}

const brandMap = normalizedKeyMap(data.brands, (key) => key.toLowerCase());
const categoryMap = normalizedKeyMap(data.categories, normalizeHebrewSearch);
const productMap = normalizedKeyMap(data.products, (key) => key.toUpperCase().replace(/\s+/g, " ").trim());

export function brandAliases(slug: string | null, name?: string | null): string[] {
  const out = new Set<string>();
  if (slug) for (const alias of brandMap.get(slug.toLowerCase()) ?? []) out.add(alias);
  if (name) for (const alias of brandMap.get(name.toLowerCase()) ?? []) out.add(alias);
  return Array.from(out);
}

export function categoryAliases(categoryName: string | null): string[] {
  if (!categoryName) return [];
  return categoryMap.get(normalizeHebrewSearch(categoryName)) ?? [];
}

export function productAliases(modelNumber: string): string[] {
  return productMap.get(modelNumber.toUpperCase().replace(/\s+/g, " ").trim()) ?? [];
}

export interface NormalizedPhrase {
  query: string;
  means: string;
  category: string;
}

/** Longest first, so "פן מחליק" wins over "פן". */
export const SEARCH_PHRASES: NormalizedPhrase[] = (data.phrases ?? [])
  .map((phrase) => ({
    query: normalizeHebrewSearch(phrase.query),
    means: normalizeHebrewSearch(phrase.means),
    category: normalizeHebrewSearch(phrase.category),
  }))
  .filter((phrase) => phrase.query.length >= 2 && phrase.means.length >= 2 && phrase.query !== phrase.means)
  .sort((a, b) => b.query.length - a.query.length);

export const SEARCH_REWRITES: Map<string, string> = new Map(
  Object.entries(data.rewrites ?? {})
    .map(([from, to]) => [normalizeHebrewSearch(from), normalizeHebrewSearch(to)] as const)
    .filter(([from, to]) => from.length >= 2 && to.length >= 1 && from !== to)
);

// Stop words may be one letter long (Russian "в", English "a").
export const EXTRA_STOP_WORDS: Set<string> = new Set((data.stopWords ?? []).map(normalizeHebrewSearch).filter(Boolean));
