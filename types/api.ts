import { z } from "zod";

/**
 * Raw shapes returned by the Base44 public catalog API.
 * Only safe, public fields are modeled here. Sensitive fields
 * (price, cost, supplier cost, profit margin, exact stock quantity,
 * internal notes, admin fields) must NEVER be added to this schema.
 */
/**
 * One entry of a product's image gallery.
 *
 * `position` orders the set and `is_primary` marks the lead shot, which in
 * practice repeats `primary_image` as element 0 — the normalizer dedupes
 * rather than trusting either side to be consistent about it.
 */
export const Base44GalleryImageSchema = z.object({
  url: z.string().url(),
  position: z.number().nullable().optional(),
  is_primary: z.boolean().nullable().optional(),
});

export type Base44GalleryImage = z.infer<typeof Base44GalleryImageSchema>;

export const Base44ProductSchema = z.object({
  model_number: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1).nullable().optional(),
  category: z.string().min(1).nullable().optional(),
  image_url: z.string().url().nullable().optional().catch(null),
  origin_country: z.string().nullable().optional(),
  technical_specifications: z.string().nullable().optional(),
  product_capabilities: z.string().nullable().optional(),
  is_available: z.boolean().nullable().optional(),

  /** Lead image. Currently mirrors `image_url` on every record that has one. */
  primary_image: z.string().url().nullable().optional().catch(null),
  /**
   * Additional shots of the same product.
   *
   * Both the individual entry and the array itself fall back rather than
   * throw. A single malformed gallery row would otherwise fail the whole
   * response, and `fetchRawCatalog` answers a failed parse by serving the
   * mock catalog — trading 948 real products for a handful of fake ones
   * because one image URL was typed wrong. A bad row is dropped instead;
   * `normalizeProduct` filters the nulls out.
   */
  gallery_images: z
    .array(Base44GalleryImageSchema.nullable().catch(null))
    .nullable()
    .optional()
    .catch(null),
  /** Yuval's own note on the product. Free prose, not a spec line. */
  expert_content: z.string().nullable().optional().catch(null),
});

export type Base44Product = z.infer<typeof Base44ProductSchema>;

export const Base44CatalogResponseSchema = z.object({
  success: z.boolean(),
  count: z.number().optional(),
  filters_applied: z
    .object({
      category: z.string().nullable().optional(),
      brand: z.string().nullable().optional(),
    })
    .optional(),
  /**
   * Products, parsed one at a time.
   *
   * A whole-array schema means one unusable record rejects the response, and
   * the caller answers a rejected response by serving the 20-product mock
   * catalog — so a single typo upstream would replace 948 real products with
   * 20 fake ones across the entire site. Per-record `.catch(null)` drops just
   * the bad record; `fetchRawCatalog` filters the nulls and logs the count.
   */
  data: z.array(Base44ProductSchema.nullable().catch(null)).default([]),
  error: z.string().optional(),
});

export type Base44CatalogResponse = z.infer<typeof Base44CatalogResponseSchema>;

export interface CatalogFetchParams {
  category?: string;
  brand?: string;
}

export type CatalogFetchResult =
  | { ok: true; data: Base44Product[]; source: "api" | "mock" }
  | { ok: false; error: string; data: Base44Product[]; source: "mock" };
