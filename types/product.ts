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
  /**
   * Every distinct image of the product, lead shot first — `imageUrl` is
   * always `images[0]`. Usually length 0 or 1; the gallery UI only appears
   * once the feed supplies a second shot.
   */
  images: string[];
  originCountry: string | null;
  specs: SpecEntry[];
  capabilities: string[];
  description: string;
  availability: AvailabilityState;
  slug: string;
  /**
   * Yuval's professional note on this model, when he has written one.
   *
   * Everything else on a product page comes from the supplier feed and is
   * therefore byte-identical to every competitor carrying the same model.
   * This is the one field that is ours, so it is treated as the page's
   * primary content: it leads the meta description and the structured-data
   * description, and it is the only product copy with a named author.
   */
  expertNote: string | null;
  /**
   * The model code to show, when the store owner confirmed that the feed's
   * code is wrong (e.g. the feed says "RD67EBK", the unit is an RD67BK).
   * `modelNumber` stays the feed's code: it is the join key and part of the
   * slug, so URLs, the request basket and stock lookups are unaffected.
   * Read it through `shownModel`.
   */
  displayModelNumber?: string;
}

/** The model code a visitor should see: the confirmed one, else the feed's. */
export function shownModel(product: Pick<Product, "modelNumber" | "displayModelNumber">): string {
  return product.displayModelNumber ?? product.modelNumber;
}

export interface RequestBasketItem {
  modelNumber: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  brand: string | null;
}
