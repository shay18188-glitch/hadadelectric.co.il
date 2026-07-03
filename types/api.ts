import { z } from "zod";

/**
 * Raw shapes returned by the Base44 public catalog API.
 * Only safe, public fields are modeled here. Sensitive fields
 * (price, cost, supplier cost, profit margin, exact stock quantity,
 * internal notes, admin fields) must NEVER be added to this schema.
 */
export const Base44ProductSchema = z.object({
  model_number: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1).nullable().optional(),
  category: z.string().min(1).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  origin_country: z.string().nullable().optional(),
  technical_specifications: z.string().nullable().optional(),
  product_capabilities: z.string().nullable().optional(),
  is_available: z.boolean().nullable().optional(),
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
  data: z.array(Base44ProductSchema).default([]),
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
