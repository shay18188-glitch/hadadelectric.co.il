import "server-only";

import compiled from "@/content/productResearch.json";
import corrections from "@/content/productCorrections.json";
import type { PublishedResearch } from "@/lib/research/schema";
import type { Product } from "@/types/product";

/**
 * Researched product data, as compiled by `scripts/compile-research.mts`.
 *
 * Server-only on purpose: the file grows with the catalog, and `normalize.ts`
 * is reachable from client code, so the join happens here in the catalog
 * layer instead of inside the normalizer.
 */
const RESEARCH = compiled as unknown as Record<string, PublishedResearch>;

/**
 * Model codes the store owner confirmed are wrong in the feed, keyed by the
 * feed's code. Only the displayed code changes; see `Product.displayModelNumber`.
 * The lasting fix is to correct the code in Base44 as well.
 */
const CORRECTIONS = new Map(
  Object.entries(corrections as Record<string, { modelNumber: string }>).map(([feed, c]) => [feed.trim().toUpperCase(), c.modelNumber])
);

export function getPublishedResearch(modelNumber: string): PublishedResearch | null {
  return RESEARCH[modelNumber.trim().toUpperCase()] ?? null;
}

/**
 * Replaces the feed's specs and capabilities with the verified ones.
 *
 * For a researched model the supplier text is not merged back in: whatever in
 * it could be confirmed is already in the record, and whatever could not is
 * exactly what must not be published as fact. Everything else on the product
 * — name, slug, images, availability — stays the feed's, so URLs, stock and
 * the rest of the site behave as before.
 */
export function applyResearch(product: Product): Product {
  const corrected = CORRECTIONS.get(product.modelNumber.trim().toUpperCase());
  if (corrected) product = { ...product, displayModelNumber: corrected };
  const research = getPublishedResearch(product.modelNumber);
  if (!research) return product;
  return {
    ...product,
    specs: research.specGroups.flatMap((group) => group.rows.map(({ label, value }) => ({ label, value }))),
    capabilities: research.features,
    description: research.summary || product.description,
  };
}
