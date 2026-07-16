import type { Metadata } from "next";
import { Suspense } from "react";
import { getBrands, getCategories, getProducts } from "@/lib/base44/catalog";
import { createFuseIndex, searchProducts } from "@/lib/search/fuse";
import { matchCategories } from "@/lib/search/categorySearch";
import { ProductGrid } from "@/components/ProductGrid";
import { Filters } from "@/components/Filters";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategorySuggestions } from "@/components/CategorySuggestions";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";
import type { Product } from "@/types/product";

export const revalidate = 10800; // 3 hours

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
    translations: canonicalPath === "/products" && !hasFilters ? TRANSLATED_PATHS["/products"] : undefined,
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

  let categorySuggestions: ReturnType<typeof matchCategories> = [];

  if (params.q) {
    const fuse = createFuseIndex(filtered);
    filtered = searchProducts(fuse, params.q, 200);
    // Only surface category suggestions when the user typed a free-text
    // query — never for category/brand filter selections, so this stays a
    // progressive-enhancement layer on top of the existing filter UX.
    categorySuggestions = matchCategories(categories, params.q, 4);
  } else {
    filtered = sortProducts(filtered, params.sort);
  }

  return (
    <>
      <Breadcrumbs items={[{ name: "קטלוג", path: "/products" }]} />
      <div className="container-page pb-12 md:pb-16">
        <div className="page-intro-shell">
          <p className="section-kicker">835+ מוצרים במקום אחד</p>
          <h1 className="mt-3">קטלוג מוצרי חשמל</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite-soft/80 md:text-base">
            קטלוג מלא של מוצרי חשמל לבית. סננו לפי קטגוריה, מותג וזמינות, וקבלו ייעוץ אישי ובדיקת מלאי מדויקת מצוות החנות.
          </p>
        </div>

        <div className="surface-card mt-6 rounded-[1.5rem] p-3 md:mt-8 md:p-5">
          <Suspense fallback={null}>
            <Filters categories={categories} brands={brands} />
          </Suspense>
        </div>

        {categorySuggestions.length > 0 && (
          <div className="mt-5">
            <CategorySuggestions categories={categorySuggestions} />
          </div>
        )}

        <p className="mt-4 text-sm text-graphite-soft/70">{filtered.length} מוצרים</p>

        <div className="mt-3 md:mt-4">
          <ProductGrid products={filtered} />
        </div>
      </div>
    </>
  );
}
