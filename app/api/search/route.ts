import { NextRequest, NextResponse } from "next/server";
import { buildBrands, buildCategories } from "@/lib/base44/catalog";
import { createFuseIndex, productSearchBlob, searchProducts } from "@/lib/search/fuse";
import { matchCategories } from "@/lib/search/categorySearch";
import { findBrandIntent, matchBrands } from "@/lib/search/brandSearch";
import { getQuickFilters } from "@/lib/search/quickFilters";
import { normalizeHebrewSearch, SEARCH_SYNONYMS } from "@/lib/search/normalizeHebrew";
import { prioritizeProductsWithImages } from "@/lib/search/productSorting";
import { clientIp } from "@/lib/http/security";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import searchCatalog from "@/content/search-catalog.json";

export const runtime = "nodejs";

const RATE_LIMIT = 120; // autocomplete queries per minute per IP
const SEARCH_INDEX_TTL_MS = 3 * 60 * 60 * 1000;

type SearchIndex = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  fuse: ReturnType<typeof createFuseIndex>;
  expiresAt: number;
};

let searchIndex: SearchIndex | null = null;

function getSearchIndex(): SearchIndex {
  if (searchIndex && searchIndex.expiresAt > Date.now()) return searchIndex;

  // Generated from the live public catalog during every deployment. Keeping
  // the search data in the function bundle removes the slow Base44 network
  // round-trip from the shopper's first autocomplete request.
  const products = searchCatalog.products as Product[];
  searchIndex = {
    products,
    categories: buildCategories(products),
    brands: buildBrands(products),
    fuse: createFuseIndex(products, searchCatalog.fuseIndex),
    expiresAt: Date.now() + SEARCH_INDEX_TTL_MS,
  };
  return searchIndex;
}

// Autocomplete must never wait for the analytics Redis connection. A local
// best-effort guard is sufficient for this small, public, cacheable endpoint.
const searchHits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (searchHits.size > 2_000) {
    for (const [storedIp, entry] of searchHits) {
      if (entry.resetAt <= now) searchHits.delete(storedIp);
    }
  }
  const key = ip || "unknown";
  const current = searchHits.get(key);
  if (!current || current.resetAt <= now) {
    searchHits.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

export async function GET(request: NextRequest) {
  // Abuse throttle for the public search endpoint.
  if (isRateLimited(clientIp(request))) {
    return NextResponse.json(
      { results: [], categories: [], brands: [], quickFilters: [], error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json(
      { results: [], categories: [], brands: [], quickFilters: [] },
      { headers: CACHE_HEADERS }
    );
  }

  const startedAt = performance.now();
  const { products, categories, brands, fuse } = getSearchIndex();

  const normalizedQuery = normalizeHebrewSearch(q);
  const categoryMatches = matchCategories(categories, q, 4);
  const hasCategoryIntent = SEARCH_SYNONYMS.some((group) =>
    group.map(normalizeHebrewSearch).some((term) => normalizedQuery.includes(term))
  );
  const matchedCategorySlugs = new Set(categoryMatches.map((category) => category.slug));
  const brandIntentMatches = findBrandIntent(brands, q);
  const matchedBrandSlugs = new Set(brandIntentMatches.map((brand) => brand.slug));

  const productMatches = searchProducts(fuse, q, 20, products);
  const focusedProducts = productMatches.filter((product) => {
    const categoryMatch = !hasCategoryIntent || matchedCategorySlugs.size === 0 ||
      Boolean(product.categorySlug && matchedCategorySlugs.has(product.categorySlug));
    const brandMatch = matchedBrandSlugs.size === 0 ||
      Boolean(product.brandSlug && matchedBrandSlugs.has(product.brandSlug));
    return categoryMatch && brandMatch;
  });
  const intentMeasurements = normalizedQuery.match(/\d+(?:\.\d+)?\s+(?:אינצ|קג)/g) ?? [];
  const hasStructuredIntent = hasCategoryIntent || matchedBrandSlugs.size > 0 || intentMeasurements.length > 0;
  const structuredFallback = hasStructuredIntent
    ? products.filter((product) => {
        const categoryMatch = !hasCategoryIntent || matchedCategorySlugs.size === 0 ||
          Boolean(product.categorySlug && matchedCategorySlugs.has(product.categorySlug));
        const brandMatch = matchedBrandSlugs.size === 0 ||
          Boolean(product.brandSlug && matchedBrandSlugs.has(product.brandSlug));
        const productText = productSearchBlob(product);
        const measurementMatch = intentMeasurements.every((measurement) => productText.includes(measurement));
        return categoryMatch && brandMatch && measurementMatch;
      })
    : [];
  const rankedProducts = [...focusedProducts];
  for (const product of structuredFallback) {
    if (rankedProducts.length >= 8) break;
    if (!rankedProducts.some((candidate) => candidate.modelNumber === product.modelNumber)) {
      rankedProducts.push(product);
    }
  }

  const results = prioritizeProductsWithImages(rankedProducts).slice(0, 8).map((p) => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    imageUrl: p.imageUrl,
    availability: p.availability,
  }));

  const matchedCategories = categoryMatches.map((c) => ({
    name: c.name,
    slug: c.slug,
    productCount: c.productCount,
  }));

  const matchedBrands = matchBrands(brands, q, 4).map((brand) => ({
    name: brand.name,
    slug: brand.slug,
    productCount: brand.productCount,
  }));
  const quickFilters = categoryMatches[0] ? getQuickFilters(products, categoryMatches[0]) : [];

  return NextResponse.json(
    {
      results,
      categories: matchedCategories,
      brands: matchedBrands,
      quickFilters,
      normalizedQuery,
    },
    {
      headers: {
        ...CACHE_HEADERS,
        "Server-Timing": `search;dur=${(performance.now() - startedAt).toFixed(1)}`,
      },
    }
  );
}
