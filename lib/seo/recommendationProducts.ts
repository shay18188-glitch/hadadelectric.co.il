import "server-only";

import { getProducts } from "@/lib/base44/catalog";
import type { RecommendationMatch, RecommendationPage } from "@/content/recommendationPages";
import type { Product } from "@/types/product";

function searchableName(product: Product): string {
  return product.name
    .toLowerCase()
    .replace(/["'׳״’]/g, "")
    .replace(/[.\-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesIntent(product: Product, match: RecommendationMatch): boolean {
  const name = searchableName(product);

  switch (match) {
    case "washing-10kg":
      return product.categorySlug === "washing-machines" && /(^|\D)10\s*(קג|kg)(\D|$)/i.test(name);
    case "washing-9kg":
      return product.categorySlug === "washing-machines" && /(^|\D)9\s*(קג|kg)(\D|$)/i.test(name);
    case "four-door-refrigerators":
      return product.categorySlug === "refrigerators" && /(^|\s)(4|ארבע)\s*דלתות(\s|$)/.test(name);
    case "bottom-freezer-refrigerators":
      return product.categorySlug === "refrigerators" && name.includes("מקפיא תחתון");
    case "built-in-ovens":
      return product.categorySlug === "ovens" && name.includes("בנוי");
    case "integrated-dishwashers":
      return product.categorySlug === "dishwashers" && name.includes("אינטגרלי");
    case "tvs-65-inch":
      return product.categorySlug === "tvs" && /(^|\D)65(\D|$)/.test(name);
    case "induction-cooktops":
      return product.categorySlug === "cooktops" && name.includes("אינדוקציה");
    case "robot-vacuums":
      return product.categorySlug === "robot-vacuums";
    case "air-conditioners-1hp":
      return product.categorySlug === "air-conditioners" && /(^|\D)1\s*כס(\D|$)/.test(name);
  }
}

function productQualityScore(product: Product): number {
  return (
    (product.availability === "in_stock" ? 100 : product.availability === "unknown" ? 30 : 0) +
    (product.imageUrl ? 10 : 0) +
    Math.min(product.specs.length, 8) +
    Math.min(product.capabilities.length, 6)
  );
}

export async function getRecommendationProducts(page: RecommendationPage): Promise<Product[]> {
  const products = await getProducts();
  return filterRecommendationProducts(products, page);
}

export function filterRecommendationProducts(
  products: Product[],
  page: RecommendationPage
): Product[] {
  return products
    .filter((product) => matchesIntent(product, page.match))
    .sort((a, b) => productQualityScore(b) - productQualityScore(a));
}
