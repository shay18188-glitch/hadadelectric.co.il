import type { Base44Product } from "@/types/api";
import type { AvailabilityState, Product, SpecEntry } from "@/types/product";
import { generateBrandSlug, generateCategorySlug, generateProductSlug } from "@/lib/slug/slugify";

/**
 * Splits a free-text specifications string (e.g. "נפח: 72 ליטר; דירוג: A")
 * into label/value pairs. Falls back to a single unlabeled entry when the
 * text doesn't follow a "label: value" pattern.
 */
function parseSpecs(raw: string | null | undefined): SpecEntry[] {
  if (!raw) return [];
  const chunks = raw
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return chunks.map((chunk) => {
    const separatorMatch = chunk.match(/^(.+?):\s*(.+)$/);
    if (separatorMatch) {
      return { label: separatorMatch[1].trim(), value: separatorMatch[2].trim() };
    }
    return { label: "", value: chunk };
  });
}

function parseCapabilities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toAvailability(isAvailable: boolean | null | undefined): AvailabilityState {
  if (isAvailable === true) return "in_stock";
  if (isAvailable === false) return "out_of_stock";
  return "unknown";
}

function buildDescription(product: Base44Product): string {
  const parts: string[] = [];
  if (product.product_capabilities) parts.push(product.product_capabilities);
  if (parts.length === 0) {
    return `לפרטים נוספים על ${product.name} וזמינות המוצר, ניתן לפנות לחדד יובל אלקטריק בע״מ בוואטסאפ או בטלפון.`;
  }
  return parts.join(" ");
}

export function normalizeProduct(product: Base44Product): Product {
  const brand = product.brand?.trim() || null;
  const category = product.category?.trim() || null;

  return {
    modelNumber: product.model_number,
    name: product.name,
    brand,
    brandSlug: brand ? generateBrandSlug(brand) : null,
    category,
    categorySlug: category ? generateCategorySlug(category) : null,
    imageUrl: product.image_url ?? null,
    originCountry: product.origin_country ?? null,
    specs: parseSpecs(product.technical_specifications),
    capabilities: parseCapabilities(product.product_capabilities),
    description: buildDescription(product),
    availability: toAvailability(product.is_available),
    slug: generateProductSlug(product.name, product.model_number),
  };
}
