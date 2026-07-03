export type AvailabilityState = "in_stock" | "out_of_stock" | "unknown";

export interface SpecEntry {
  label: string;
  value: string;
}

/**
 * Normalized, safe product model used throughout the site.
 * Never add price / cost / quantity / internal fields here.
 */
export interface Product {
  modelNumber: string;
  name: string;
  brand: string | null;
  brandSlug: string | null;
  category: string | null;
  categorySlug: string | null;
  imageUrl: string | null;
  originCountry: string | null;
  specs: SpecEntry[];
  capabilities: string[];
  description: string;
  availability: AvailabilityState;
  slug: string;
}

export interface RequestBasketItem {
  modelNumber: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  brand: string | null;
}
