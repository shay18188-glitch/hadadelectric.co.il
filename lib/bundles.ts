import type { BundleDefinition, BundleProductSlot } from "@/content/bundles";
import type { Product } from "@/types/product";

export interface SelectedBundleProduct {
  slot: BundleProductSlot;
  product: Product;
}

function searchableText(product: Product): string {
  return [
    product.name,
    product.brand,
    product.category,
    product.modelNumber,
    product.description,
    ...product.capabilities,
    ...product.specs.flatMap((spec) => [spec.label, spec.value]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("he");
}

function scoreProduct(product: Product, slot: BundleProductSlot): number {
  const text = searchableText(product);
  const preferenceText = [product.name, product.modelNumber, product.brand, product.category]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("he");
  let score = 0;

  if (product.availability === "in_stock") score += 1_000;
  else if (product.availability === "unknown") score += 100;
  if (product.imageUrl) score += 250;
  if (product.description.length > 40) score += 20;
  score += Math.min(product.specs.length, 10);

  const preferredTerms = slot.preferredTerms ?? [];
  preferredTerms.forEach((term, index) => {
    if (preferenceText.includes(term.toLocaleLowerCase("he"))) {
      score += (preferredTerms.length - index) * 160;
    }
  });
  for (const term of slot.avoidTerms ?? []) {
    if (text.includes(term.toLocaleLowerCase("he"))) score -= 400;
  }

  return score;
}

export function selectBundleProducts(bundle: BundleDefinition, products: Product[]): SelectedBundleProduct[] {
  const usedModels = new Set<string>();
  const selected: SelectedBundleProduct[] = [];

  for (const slot of bundle.slots) {
    const candidates = products
      .filter((product) => product.category === slot.category && !usedModels.has(product.modelNumber))
      .sort((a, b) => scoreProduct(b, slot) - scoreProduct(a, slot));

    const product = candidates[0];
    if (!product) continue;

    usedModels.add(product.modelNumber);
    selected.push({ slot, product });
  }

  return selected;
}
