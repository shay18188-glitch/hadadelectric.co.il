import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { buildProductFacets } from "@/lib/search/productFacets";

export interface QuickSearchFilter {
  label: string;
  query: string;
  categorySlug: string;
  count: number;
}

export function getQuickFilters(products: Product[], category: Category, limit = 9): QuickSearchFilter[] {
  return buildProductFacets(products, category.slug)
    .flatMap((facet) => facet.options.map((option) => ({
      label: option.label,
      query: option.query,
      categorySlug: category.slug,
      count: option.count,
    })))
    .slice(0, limit);
}
