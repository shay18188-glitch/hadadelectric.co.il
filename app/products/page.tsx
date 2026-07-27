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
import { PageHero } from "@/components/PageHero";
import { getQuickFilters } from "@/lib/search/quickFilters";
import {
  buildProductFacets,
  filterProductsByFacets,
  parseFacetSelections,
} from "@/lib/search/productFacets";
import { sortProducts } from "@/lib/search/productSorting";

export const revalidate = 10800; // 3 hours

interface ProductsSearchParams {
  [key: string]: string | string[] | undefined;
  q?: string;
  category?: string;
  brand?: string;
  inStock?: string;
  sort?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFacetFilters = Object.keys(params).some((key) => key.startsWith("f_"));
  const hasFilters = Boolean(params.q || params.category || params.brand || params.inStock || params.panel || hasFacetFilters);

  let canonicalPath = "/products";
  if (params.category) canonicalPath = `/categories/${params.category}`;
  else if (params.brand) canonicalPath = `/brands/${params.brand}`;

  return buildMetadata({
    title: "קטלוג מוצרי חשמל",
    description:
      "עיינו בקטלוג מוצרי החשמל של חדד יובל אלקטריק — מקררים, מכונות כביסה, תנורים, טלוויזיות ועוד, עם בדיקת זמינות והזמנה ישירה בוואטסאפ או בטלפון.",
    path: canonicalPath,
    noindex: hasFilters,
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

  let scopedProducts = allProducts;

  if (params.category) {
    scopedProducts = scopedProducts.filter((p) => p.categorySlug === params.category);
  }
  if (params.brand) {
    scopedProducts = scopedProducts.filter((p) => p.brandSlug === params.brand);
  }
  if (params.inStock !== "false") {
    scopedProducts = scopedProducts.filter((p) => p.availability === "in_stock");
  }

  const facetSelections = parseFacetSelections(params);
  let filtered = scopedProducts;

  let categorySuggestions: ReturnType<typeof matchCategories> = [];

  if (params.q) {
    const fuse = createFuseIndex(filtered);
    filtered = searchProducts(fuse, params.q, 200, filtered);
    // Only surface category suggestions when the user typed a free-text
    // query — never for category/brand filter selections, so this stays a
    // progressive-enhancement layer on top of the existing filter UX.
    categorySuggestions = matchCategories(categories, params.q, 4);
  } else {
    filtered = sortProducts(filtered, params.sort);
  }

  const quickFilterCategory = params.category
    ? categories.find((category) => category.slug === params.category)
    : categorySuggestions[0];
  filtered = filterProductsByFacets(filtered, facetSelections);
  const facets = quickFilterCategory
    ? buildProductFacets(scopedProducts, quickFilterCategory.slug, facetSelections)
    : [];
  const quickFilters = quickFilterCategory ? getQuickFilters(allProducts, quickFilterCategory) : [];

  return (
    <>
      <Breadcrumbs items={[{ name: "קטלוג", path: "/products" }]} />
      <div className="container-page pb-12 md:pb-16">
        <PageHero
          eyebrow={`${allProducts.length}+ מוצרים במקום אחד`}
          title="קטלוג מוצרי חשמל"
          description="קטלוג מלא של מוצרי חשמל לבית. סננו לפי קטגוריה, מותג וזמינות, וקבלו ייעוץ אישי ובדיקת מלאי מדויקת מצוות החנות."
          imageSrc="/images/hero-appliances.png"
          imageAlt="מקרר, מכונת כביסה, תנור, מזגן וטלוויזיה בקטלוג מוצרי החשמל"
          imageClassName="object-[center_55%] md:object-[34%_55%]"
          badges={
            <>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">{categories.length} קטגוריות</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">{brands.length} מותגים</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">בדיקת זמינות אישית</span>
            </>
          }
        />

        <div className="surface-card relative z-10 -mt-5 rounded-[1.5rem] p-4 md:-mt-7 md:mx-8 md:p-6">
          <Suspense fallback={null}>
            <Filters categories={categories} brands={brands} quickFilters={quickFilters} facets={facets} />
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
