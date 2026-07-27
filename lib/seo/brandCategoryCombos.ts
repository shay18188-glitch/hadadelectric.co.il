import "server-only";

import {
  BRAND_CATEGORY_MIN_PRODUCTS,
  getCuratedBrandCategoryContent,
} from "@/content/brandCategoryContent";
import { getBrandCategoryPriority } from "@/content/brandCategorySeo";
import {
  getBrandCategoryCombos,
  type BrandCategoryCombo,
} from "@/lib/base44/catalog";

/**
 * Publish only researched, hand-written intersections with enough real models
 * for a meaningful comparison. The priority order is editorial, not a blind
 * cartesian product of brands and categories.
 */
export async function getSeoBrandCategoryCombos(): Promise<BrandCategoryCombo[]> {
  const combos = await getBrandCategoryCombos(BRAND_CATEGORY_MIN_PRODUCTS);

  return combos
    .filter((combo) => Boolean(getCuratedBrandCategoryContent(combo.brandSlug, combo.categorySlug)))
    .sort(
      (a, b) =>
        getBrandCategoryPriority(a.brandSlug, a.categorySlug) -
          getBrandCategoryPriority(b.brandSlug, b.categorySlug) ||
        b.productCount - a.productCount
    );
}
