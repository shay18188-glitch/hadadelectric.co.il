import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/base44/catalog";
import { createFuseIndex, searchProducts } from "@/lib/search/fuse";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await getProducts();
  const fuse = createFuseIndex(products);
  const results = searchProducts(fuse, q, 8).map((p) => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    imageUrl: p.imageUrl,
    availability: p.availability,
  }));

  return NextResponse.json({ results });
}
