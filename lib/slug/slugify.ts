/**
 * Slug helpers for products/categories/brands.
 *
 * All public URLs use English/Latin slugs. Legacy Hebrew slugs are
 * redirected via middleware and page-level canonical redirects.
 */

import { CATEGORY_SLUGS } from "@/lib/slug/categorySlugs";
import { transliterateToLatin } from "@/lib/slug/transliterate";

const KNOWN_BRAND_SLUGS: Record<string, string> = {
  LG: "lg",
  Samsung: "samsung",
  Sharp: "sharp",
  Electrolux: "electrolux",
  TCL: "tcl",
  Bosch: "bosch",
  BOSCH: "bosch",
};

/** Old slugify that kept Hebrew characters — used only for legacy redirects. */
export function legacySlugify(input: string): string {
  return input
    .trim()
    .replace(/["'׳״]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function baseSlugify(input: string): string {
  const latin = transliterateToLatin(input);
  return latin
    .trim()
    .replace(/["'׳״]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugify(input: string): string {
  return baseSlugify(input).toLowerCase();
}

export function generateCategorySlug(category: string): string {
  const trimmed = category.trim();
  const known = CATEGORY_SLUGS[trimmed];
  if (known) return known;
  return slugify(trimmed);
}

export function generateBrandSlug(brand: string): string {
  const trimmed = brand.trim();
  const known = KNOWN_BRAND_SLUGS[trimmed];
  if (known) return known;
  return slugify(trimmed);
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

/** Previous slug format that kept Hebrew in the readable name segment. */
export function generateLegacyProductSlug(name: string, modelNumber: string): string {
  const namePart = legacySlugify(name);
  const modelPart = legacySlugify(modelNumber).toUpperCase();
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

export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}
