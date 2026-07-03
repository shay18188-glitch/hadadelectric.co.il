import Fuse, { type IFuseOptions } from "fuse.js";
import type { Product } from "@/types/product";
import { expandWithSynonyms } from "@/lib/search/normalizeHebrew";

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

function toSearchable(products: Product[]): SearchableProduct[] {
  return products.map((p) => ({
    ...p,
    searchBlob: [
      p.name,
      p.brand,
      p.category,
      p.modelNumber,
      p.originCountry,
      ...p.capabilities,
      ...p.specs.map((s) => `${s.label} ${s.value}`),
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

export function createFuseIndex(products: Product[]): Fuse<SearchableProduct> {
  return new Fuse(toSearchable(products), FUSE_OPTIONS);
}

export function searchProducts(fuse: Fuse<SearchableProduct>, query: string, limit = 60): Product[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const expandedTerms = expandWithSynonyms(trimmed);
  const seen = new Map<string, { product: Product; score: number }>();

  for (const term of expandedTerms) {
    const results = fuse.search(term, { limit });
    for (const { item, score = 1 } of results) {
      const existing = seen.get(item.modelNumber);
      if (!existing || score < existing.score) {
        seen.set(item.modelNumber, { product: item, score });
      }
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.product)
    .slice(0, limit);
}
