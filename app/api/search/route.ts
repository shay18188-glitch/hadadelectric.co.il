import { NextRequest, NextResponse } from "next/server";
import { getCategories, getProducts } from "@/lib/base44/catalog";
import { createFuseIndex, searchProducts } from "@/lib/search/fuse";
import { matchCategories } from "@/lib/search/categorySearch";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], categories: [] });
  }

  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const fuse = createFuseIndex(products);
  const results = searchProducts(fuse, q, 8).map((p) => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    imageUrl: p.imageUrl,
    availability: p.availability,
  }));

  const matchedCategories = matchCategories(categories, q, 4).map((c) => ({
    name: c.name,
    slug: c.slug,
    productCount: c.productCount,
  }));

  return NextResponse.json({ results, categories: matchedCategories });
}
