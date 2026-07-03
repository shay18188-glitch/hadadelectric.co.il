/**
 * Slug helpers for products/categories/brands.
 *
 * The Base44 catalog API does not provide slugs, so we generate
 * stable, readable, URL-safe slugs ourselves. Hebrew text is kept
 * (Hebrew URLs are indexed fine by Google) but normalized so the
 * same input always produces the same slug.
 */

const KNOWN_CATEGORY_SLUGS: Record<string, string> = {
  "מקררים": "refrigerators",
  "מקפיאים": "freezers",
  "מכונות כביסה": "washing-machines",
  "מייבשי כביסה": "dryers",
  "מדיחי כלים": "dishwashers",
  "תנורים": "ovens",
  "כיריים": "cooktops",
  "קולטי אדים": "range-hoods",
  "מיקרוגלים": "microwaves",
  "טלוויזיות": "tvs",
  "מזגנים": "air-conditioners",
  "מוצרי חשמל קטנים": "small-appliances",
  "אביזרים נלווים": "accessories",
};

const KNOWN_BRAND_SLUGS: Record<string, string> = {
  LG: "lg",
  Samsung: "samsung",
  Sharp: "sharp",
  Electrolux: "electrolux",
  TCL: "tcl",
  Bosch: "bosch",
};

function baseSlugify(input: string): string {
  return input
    .trim()
    .replace(/["'׳״]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugify(input: string): string {
  return baseSlugify(input).toLowerCase();
}

export function generateCategorySlug(category: string): string {
  const known = KNOWN_CATEGORY_SLUGS[category.trim()];
  if (known) return known;
  return slugify(category);
}

export function generateBrandSlug(brand: string): string {
  const known = KNOWN_BRAND_SLUGS[brand.trim()];
  if (known) return known;
  return slugify(brand);
}

export function categorySlugToName(
  slug: string,
  categories: { name: string; slug: string }[]
): string | null {
  const match = categories.find((c) => c.slug === slug);
  return match ? match.name : null;
}

/**
 * Product slugs always append the model_number to guarantee
 * uniqueness (model_number is unique per the Base44 API contract).
 */
export function generateProductSlug(name: string, modelNumber: string): string {
  const namePart = baseSlugify(name);
  const modelPart = baseSlugify(modelNumber).toUpperCase();
  return namePart ? `${namePart}-${modelPart}` : modelPart;
}

/**
 * Extract the trailing model-number token from a product slug so we
 * can look products up reliably even if the readable name part
 * drifts (e.g. old links, minor catalog renames).
 */
export function extractModelNumberFromSlug(slug: string): string {
  const parts = slug.split("-");
  return parts[parts.length - 1] ?? slug;
}
