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
import { generateBrandSlug, generateCategorySlug } from "@/lib/slug/slugify";

const DEFAULT_APP_ID = "697dbf6bdde569f5ea050a4e";
const DEFAULT_BASE_URL = `https://base44.app/api/apps/${
  process.env.NEXT_PUBLIC_BASE44_APP_ID || DEFAULT_APP_ID
}`;

const BASE44_APP_BASE_URL = process.env.BASE44_APP_BASE_URL || DEFAULT_BASE_URL;
const CATALOG_ENDPOINT = `${BASE44_APP_BASE_URL}/functions/getProductCatalog`;

// Revalidate the catalog every 3 hours to limit Vercel CPU from ISR refreshes.
const CATALOG_REVALIDATE_SECONDS = 3 * 60 * 60;

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
    return { products: result.data.map(normalizeProduct), usedFallback: false };
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
  return { products: mock.map(normalizeProduct), usedFallback: true };
}

export async function getProducts(): Promise<Product[]> {
  const { products } = await getProductCatalog();
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
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
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
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
