import "server-only";

import {
  Base44CatalogResponseSchema,
  type Base44Product,
  type CatalogFetchParams,
} from "@/types/api";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import { MOCK_CATALOG } from "@/lib/base44/mockCatalog";
import { normalizeProduct } from "@/lib/normalize";
import {
  extractModelNumberFromSlug,
  generateBrandSlug,
  generateCategorySlug,
  generateLegacyProductSlug,
} from "@/lib/slug/slugify";
import { resolveLegacyCategorySlug } from "@/lib/slug/legacyRedirects";
import productImageStore from "@/content/product-images.json";

const DEFAULT_APP_ID = "697dbf6bdde569f5ea050a4e";
const DEFAULT_BASE_URL = `https://base44.app/api/apps/${
  process.env.NEXT_PUBLIC_BASE44_APP_ID || DEFAULT_APP_ID
}`;

const BASE44_APP_BASE_URL = process.env.BASE44_APP_BASE_URL || DEFAULT_BASE_URL;
const CATALOG_ENDPOINT = `${BASE44_APP_BASE_URL}/functions/getProductCatalog`;

// Revalidate the catalog every 3 hours to limit Vercel CPU from ISR refreshes.
const CATALOG_REVALIDATE_SECONDS = 10800; // 3 hours

/** Only ever forward these two safe filter params to Base44. */
function buildQueryString(params?: CatalogFetchParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  const category = params.category?.trim().slice(0, 100);
  const brand = params.brand?.trim().slice(0, 100);
  if (category) search.set("category", category);
  if (brand) search.set("brand", brand);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function fetchRawCatalog(
  params?: CatalogFetchParams
): Promise<{ ok: true; data: Base44Product[] } | { ok: false; error: string }> {
  const url = `${CATALOG_ENDPOINT}${buildQueryString(params)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["catalog"] },
    });

    if (res.status === 429) {
      console.error("[base44] rate limited (429) fetching catalog");
      return { ok: false, error: "rate_limited" };
    }
    if (res.status === 405) {
      console.error("[base44] method not allowed (405) fetching catalog");
      return { ok: false, error: "method_not_allowed" };
    }
    if (!res.ok) {
      console.error(`[base44] unexpected status ${res.status} fetching catalog`);
      return { ok: false, error: `http_${res.status}` };
    }

    const json = await res.json();
    const parsed = Base44CatalogResponseSchema.safeParse(json);

    if (!parsed.success) {
      console.error("[base44] catalog response failed validation", parsed.error.issues);
      return { ok: false, error: "invalid_response" };
    }
    if (!parsed.data.success) {
      console.error("[base44] catalog response success=false", parsed.data.error);
      return { ok: false, error: parsed.data.error || "unknown_error" };
    }

    return { ok: true, data: parsed.data.data };
  } catch (err) {
    console.error("[base44] network error fetching catalog", err);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Fills in imageUrl for products the catalog has no image for, from the
 * committed store built by `npm run find-images` (scripts/find-product-images.mts).
 * Never overrides an image that came with the catalog data.
 */
function applyImageOverrides(products: Product[]): Product[] {
  const found = productImageStore.images as Record<string, { url: string }>;
  return products.map((p) => {
    if (p.imageUrl) return p;
    const override = found[p.modelNumber.toUpperCase()];
    return override ? { ...p, imageUrl: override.url } : p;
  });
}

/**
 * Fetches the full/filtered catalog. Falls back to a small mock
 * dataset if the live API is unreachable, so the site never crashes
 * or shows an empty catalog. The fallback is never silently merged
 * with real data.
 */
export async function getProductCatalog(
  params?: CatalogFetchParams
): Promise<{ products: Product[]; usedFallback: boolean }> {
  const result = await fetchRawCatalog(params);

  if (result.ok) {
    return { products: applyImageOverrides(result.data.map(normalizeProduct)), usedFallback: false };
  }

  console.error(
    `[base44] falling back to mock catalog (reason: ${result.error})`
  );
  let mock = MOCK_CATALOG;
  if (params?.category) {
    mock = mock.filter((p) => p.category === params.category);
  }
  if (params?.brand) {
    mock = mock.filter((p) => p.brand === params.brand);
  }
  return { products: applyImageOverrides(mock.map(normalizeProduct)), usedFallback: true };
}

export async function getProducts(): Promise<Product[]> {
  const { products } = await getProductCatalog();
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const decoded = decodeURIComponent(slug).trim();
  const products = await getProducts();

  const exact = products.find((p) => p.slug === decoded);
  if (exact) return exact;

  const legacy = products.find((p) => generateLegacyProductSlug(p.name, p.modelNumber) === decoded);
  if (legacy) return legacy;

  const modelToken = extractModelNumberFromSlug(decoded);
  return products.find((p) => p.modelNumber.toUpperCase() === modelToken.toUpperCase()) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const products = await getProducts();
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.category) continue;
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, productCount]) => ({
      name,
      slug: generateCategorySlug(name),
      productCount,
    }))
    .sort((a, b) => b.productCount - a.productCount);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const decoded = decodeURIComponent(slug).trim();
  const categories = await getCategories();
  const direct = categories.find((c) => c.slug === decoded);
  if (direct) return direct;

  const canonical = resolveLegacyCategorySlug(decoded);
  if (canonical) {
    return categories.find((c) => c.slug === canonical) ?? null;
  }

  return null;
}

export async function getBrands(): Promise<Brand[]> {
  const products = await getProducts();
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.brand) continue;
    counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, productCount]) => ({
      name,
      slug: generateBrandSlug(name),
      productCount,
    }))
    .sort((a, b) => b.productCount - a.productCount);
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const brands = await getBrands();
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.categorySlug === categorySlug);
}

export interface BrandCategoryCombo {
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  productCount: number;
}

/**
 * High-intent brand×category intersections (e.g. "LG TVs", "Samsung fridges").
 * Only combos with at least `minCount` products are returned, so we never
 * publish a thin landing page.
 */
export async function getBrandCategoryCombos(minCount = 8): Promise<BrandCategoryCombo[]> {
  const products = await getProducts();
  const map = new Map<string, BrandCategoryCombo>();
  for (const p of products) {
    if (!p.brand || !p.category || !p.brandSlug || !p.categorySlug) continue;
    const key = `${p.brandSlug}:${p.categorySlug}`;
    const existing = map.get(key);
    if (existing) {
      existing.productCount += 1;
    } else {
      map.set(key, {
        brand: p.brand,
        brandSlug: p.brandSlug,
        category: p.category,
        categorySlug: p.categorySlug,
        productCount: 1,
      });
    }
  }
  return Array.from(map.values())
    .filter((c) => c.productCount >= minCount)
    .sort((a, b) => b.productCount - a.productCount);
}

export async function getProductsByBrandAndCategory(
  brandSlug: string,
  categorySlug: string
): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.brandSlug === brandSlug && p.categorySlug === categorySlug);
}

export async function getProductsByBrand(brandSlug: string): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.brandSlug === brandSlug);
}

/** Featured = in-stock products, spread across categories, most complete data first. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const products = await getProducts();
  const withImage = products.filter((p) => p.availability === "in_stock" && p.imageUrl);
  const pool = withImage.length >= limit ? withImage : products.filter((p) => p.availability === "in_stock");
  return pool.slice(0, limit);
}

export async function getPopularProducts(limit = 8): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.availability === "in_stock").slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = await getProducts();
  const sameCategory = products.filter(
    (p) => p.categorySlug && p.categorySlug === product.categorySlug && p.modelNumber !== product.modelNumber
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const sameBrand = products.filter(
    (p) => p.brandSlug && p.brandSlug === product.brandSlug && p.modelNumber !== product.modelNumber
  );
  const merged = [...sameCategory];
  for (const p of sameBrand) {
    if (merged.length >= limit) break;
    if (!merged.some((m) => m.modelNumber === p.modelNumber)) merged.push(p);
  }
  return merged.slice(0, limit);
}

export async function getProductsBySameBrand(product: Product, limit = 4): Promise<Product[]> {
  const products = await getProductsByBrand(product.brandSlug ?? "");
  return products.filter((p) => p.modelNumber !== product.modelNumber).slice(0, limit);
}
