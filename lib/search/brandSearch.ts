import Fuse from "fuse.js";
import type { Brand } from "@/types/brand";
import { normalizeHebrewSearch } from "@/lib/search/normalizeHebrew";

const BRAND_ALIASES: Record<string, string[]> = {
  samsung: ["סמסונג", "סמסונג"],
  lg: ["אל גי", "אלגי", "אל גיי"],
  bosch: ["בוש"],
  electrolux: ["אלקטרולוקס", "אלקטרולוקס"],
  sharp: ["שארפ"],
  hisense: ["הייסנס", "היסנס"],
  midea: ["מידאה", "מידיאה"],
  haier: ["האייר", "האיר"],
  electra: ["אלקטרה"],
  tornado: ["תדיראן", "טורנדו"],
  dreame: ["דרימי", "דרים"],
  dyson: ["דייסון", "דיסון"],
  roborock: ["רובורוק", "רובו רוק"],
  tcl: ["טי סי אל"],
};

function aliasesFor(brand: Brand): string[] {
  const key = brand.slug.toLowerCase();
  const byName = brand.name.toLowerCase();
  return [...(BRAND_ALIASES[key] ?? []), ...(BRAND_ALIASES[byName] ?? [])];
}

function containsSearchTerm(query: string, term: string): boolean {
  if (term.length <= 3) {
    return new RegExp(`(^|\\s)${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`).test(query);
  }
  return query.includes(term);
}

/** Brands explicitly written in a mixed product+brand query. */
export function findBrandIntent(brands: Brand[], query: string): Brand[] {
  const normalizedQuery = normalizeHebrewSearch(query);
  return brands.filter((brand) =>
    [brand.name, ...aliasesFor(brand)]
      .map(normalizeHebrewSearch)
      .filter((term) => term.length >= 2)
      .some((term) => containsSearchTerm(normalizedQuery, term))
  );
}

export function brandSearchText(name: string | null, slug: string | null): string {
  if (!name) return "";
  const aliases = BRAND_ALIASES[(slug ?? name).toLowerCase()] ?? BRAND_ALIASES[name.toLowerCase()] ?? [];
  return [name, ...aliases].map(normalizeHebrewSearch).join(" ");
}

export function matchBrands(brands: Brand[], query: string, limit = 5): Brand[] {
  const normalizedQuery = normalizeHebrewSearch(query);
  if (normalizedQuery.length < 2) return [];

  const directMatches = findBrandIntent(brands, query);

  const searchable = brands.map((brand) => ({ ...brand, searchText: [brand.name, ...aliasesFor(brand)].join(" ") }));
  const fuse = new Fuse(searchable, {
    threshold: 0.34,
    ignoreLocation: true,
    includeScore: true,
    keys: [{ name: "searchText", weight: 1 }],
  });

  const fuzzyMatches = fuse.search(normalizedQuery, { limit }).map(({ item }) => item);
  return [...directMatches, ...fuzzyMatches.filter((brand) => !directMatches.some((direct) => direct.slug === brand.slug))]
    .slice(0, limit);
}
