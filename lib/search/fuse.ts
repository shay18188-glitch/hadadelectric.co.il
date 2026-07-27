import Fuse, { type IFuseOptions } from "fuse.js";
import type { Product } from "@/types/product";
import { expandWithSynonyms, normalizeHebrewSearch, SEARCH_STOP_WORDS, SEARCH_SYNONYMS } from "@/lib/search/normalizeHebrew";
import { brandSearchText } from "@/lib/search/brandSearch";
import { filterProductsByFacets, inferFacetSelectionsFromQuery } from "@/lib/search/productFacets";

export interface SearchableProduct extends Product {
  searchBlob: string;
}

const FUSE_OPTIONS: IFuseOptions<SearchableProduct> = {
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "name", weight: 0.4 },
    { name: "brand", weight: 0.2 },
    { name: "category", weight: 0.15 },
    { name: "modelNumber", weight: 0.15 },
    { name: "searchBlob", weight: 0.1 },
  ],
};

export function productSearchBlob(product: Product): string {
  const precomputed = (product as Product & { searchBlob?: string }).searchBlob;
  if (precomputed) return precomputed;

  const categoryText = normalizeHebrewSearch(`${product.name} ${product.category ?? ""}`);
  const categoryAliases = SEARCH_SYNONYMS.flatMap((group) => {
    const normalizedGroup = group.map(normalizeHebrewSearch);
    return normalizedGroup.some((term) => categoryText.includes(term) || term.includes(categoryText))
      ? normalizedGroup
      : [];
  });

  return normalizeHebrewSearch([
    product.name,
    product.brand,
    brandSearchText(product.brand, product.brandSlug),
    product.category,
    product.modelNumber,
    product.originCountry,
    ...product.capabilities,
    ...product.specs.map((spec) => `${spec.label} ${spec.value}`),
    ...categoryAliases,
  ]
    .filter(Boolean)
    .join(" "));
}

export function toSearchableProducts(products: Product[]): SearchableProduct[] {
  return products.map((p) => ({
    ...p,
    searchBlob: productSearchBlob(p),
  }));
}

export function serializeFuseIndex(products: Product[]) {
  const searchable = toSearchableProducts(products);
  return Fuse.createIndex(FUSE_OPTIONS.keys ?? [], searchable).toJSON();
}

export function createFuseIndex(products: Product[], serializedIndex?: unknown): Fuse<SearchableProduct> {
  const searchable = toSearchableProducts(products);
  const parsedIndex = serializedIndex
    ? Fuse.parseIndex<SearchableProduct>(serializedIndex as ReturnType<ReturnType<typeof Fuse.createIndex>["toJSON"]>)
    : undefined;
  return new Fuse(searchable, FUSE_OPTIONS, parsedIndex);
}

export function searchProducts(
  fuse: Fuse<SearchableProduct>,
  query: string,
  limit = 60,
  products?: Product[]
): Product[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const expandedTerms = expandWithSynonyms(trimmed);
  const normalizedQuery = normalizeHebrewSearch(trimmed);
  const inferredFacets = inferFacetSelectionsFromQuery(trimmed);
  const intentNumbers = normalizedQuery.match(/\d+(?:\.\d+)?/g) ?? [];
  const intentMeasurements = normalizedQuery.match(/\d+(?:\.\d+)?\s+(?:אינצ|קג)/g) ?? [];

  // Autocomplete's common path is an exact token intersection over a
  // pre-normalized build-time blob. This avoids several expensive fuzzy-index
  // searches while still handling spelling aliases, brands and measurements.
  if (products && products.length > 0) {
    const searchable = toSearchableProducts(products);
    const queryTokens = normalizedQuery
      .split(" ")
      .filter((token) => token.length >= 2 && !SEARCH_STOP_WORDS.has(token));
    const meaningfulTokens = queryTokens.filter((token) =>
      searchable.some((product) => product.searchBlob.includes(token))
    );
    const direct = searchable
      .filter((product) => meaningfulTokens.length > 0 && meaningfulTokens.every((token) => product.searchBlob.includes(token)))
      .filter((product) =>
        intentMeasurements.length > 0
          ? intentMeasurements.every((measurement) => product.searchBlob.includes(measurement))
          : intentNumbers.every((number) =>
              new RegExp(`(^|\\s)${number.replace(".", "\\.")}(?=\\s|$)`).test(product.searchBlob)
            )
      )
      .sort((a, b) => {
        const aExact = a.searchBlob.includes(normalizedQuery) ? 0 : 1;
        const bExact = b.searchBlob.includes(normalizedQuery) ? 0 : 1;
        return aExact - bExact || a.name.localeCompare(b.name, "he");
      });
    if (direct.length > 0) {
      const facetFocused = filterProductsByFacets(direct, inferredFacets);
      return (facetFocused.length > 0 ? facetFocused : direct).slice(0, limit);
    }
  }

  const seen = new Map<string, { product: Product; score: number; numericMatch: boolean }>();

  for (const term of expandedTerms) {
    const results = fuse.search(term, { limit });
    for (const { item, score = 1 } of results) {
      const existing = seen.get(item.modelNumber);
      if (!existing || score < existing.score) {
        const numericMatch = intentMeasurements.length > 0
          ? intentMeasurements.every((measurement) => item.searchBlob.includes(measurement))
          : intentNumbers.every((number) =>
              new RegExp(`(^|\\s)${number.replace(".", "\\.")}(?=\\s|$)`).test(item.searchBlob)
            );
        seen.set(item.modelNumber, { product: item, score, numericMatch });
      }
    }
  }

  const ranked = Array.from(seen.values())
    .sort((a, b) => Number(b.numericMatch) - Number(a.numericMatch) || a.score - b.score);
  const focused = intentMeasurements.length > 0 && ranked.some((entry) => entry.numericMatch)
    ? ranked.filter((entry) => entry.numericMatch)
    : ranked;

  const productsByScore = focused.map((entry) => entry.product);
  const facetFocused = filterProductsByFacets(productsByScore, inferredFacets);
  return (facetFocused.length > 0 ? facetFocused : productsByScore).slice(0, limit);
}
