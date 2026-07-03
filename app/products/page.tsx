import type { Metadata } from "next";
import { Suspense } from "react";
import { getBrands, getCategories, getProducts } from "@/lib/base44/catalog";
import { createFuseIndex, searchProducts } from "@/lib/search/fuse";
import { ProductGrid } from "@/components/ProductGrid";
import { Filters } from "@/components/Filters";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Product } from "@/types/product";

export const revalidate = 1800;

interface ProductsSearchParams {
  q?: string;
  category?: string;
  brand?: string;
  inStock?: string;
  sort?: string;
}

function sortProducts(products: Product[], sort?: string): Product[] {
  const list = [...products];
  switch (sort) {
    case "in-stock":
      return list.sort((a, b) => Number(b.availability === "in_stock") - Number(a.availability === "in_stock"));
    case "newest":
      return list.reverse();
    case "alpha":
      return list.sort((a, b) => a.name.localeCompare(b.name, "he"));
    default:
      return list.sort((a, b) => Number(b.availability === "in_stock") - Number(a.availability === "in_stock"));
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(params.q || params.category || params.brand || params.inStock);

  let canonicalPath = "/products";
  if (params.category) canonicalPath = `/categories/${params.category}`;
  else if (params.brand) canonicalPath = `/brands/${params.brand}`;

  return buildMetadata({
    title: "קטלוג מוצרי חשמל",
    description:
      "עיינו בקטלוג מוצרי החשמל של חדד יובל אלקטריק — מקררים, מכונות כביסה, תנורים, טלוויזיות ועוד, עם בדיקת זמינות והזמנה ישירה בוואטסאפ או בטלפון.",
    path: canonicalPath,
    noindex: hasFilters && canonicalPath === "/products",
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  const params = await searchParams;
  const [allProducts, categories, brands] = await Promise.all([getProducts(), getCategories(), getBrands()]);

  let filtered = allProducts;

  if (params.category) {
    filtered = filtered.filter((p) => p.categorySlug === params.category);
  }
  if (params.brand) {
    filtered = filtered.filter((p) => p.brandSlug === params.brand);
  }
  if (params.inStock === "true") {
    filtered = filtered.filter((p) => p.availability === "in_stock");
  }

  if (params.q) {
    const fuse = createFuseIndex(filtered);
    filtered = searchProducts(fuse, params.q, 200);
  } else {
    filtered = sortProducts(filtered, params.sort);
  }

  return (
    <>
      <Breadcrumbs items={[{ name: "קטלוג", path: "/products" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">קטלוג מוצרי חשמל</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:text-base">
          קטלוג מלא של מוצרי חשמל לבית. ניתן לסנן לפי קטגוריה, מותג וזמינות, ולפנות לצוות החנות לבדיקת זמינות
          מדויקת והזמנה.
        </p>

        <div className="mt-6">
          <Suspense fallback={null}>
            <Filters categories={categories} brands={brands} />
          </Suspense>
        </div>

        <p className="mt-4 text-sm text-graphite-soft/70">{filtered.length} מוצרים</p>

        <div className="mt-4">
          <ProductGrid products={filtered} />
        </div>
      </div>
    </>
  );
}
