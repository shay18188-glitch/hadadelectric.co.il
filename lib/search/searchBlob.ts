/**
 * Precomputed search text for a product (name, brand spellings, category
 * synonyms, specs). The engine in lib/search/engine.ts indexes it as the
 * low-weight "extra" field.
 */
import type { Product } from "@/types/product";
import { normalizeHebrewSearch, SEARCH_SYNONYMS } from "@/lib/search/normalizeHebrew";
import { brandSearchText } from "@/lib/search/brandSearch";

export interface SearchableProduct extends Product {
  searchBlob: string;
}

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
