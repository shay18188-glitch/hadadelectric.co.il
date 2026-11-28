import type { Metadata } from "next";
import { Suspense } from "react";
import { getBrands, getCategories, getProducts } from "@/lib/base44/catalog";
import { getSearchEngine, type SearchOutcome } from "@/lib/search/engine";
import type { Category } from "@/types/category";
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
import { SearchResultsLogger } from "@/components/SearchResultsLogger";
import { buildWhatsAppUrl } from "@/lib/whatsapp/messages";

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

  let categorySuggestions: Category[] = [];
  let searchOutcome: SearchOutcome | null = null;

  if (params.q) {
    // One engine over the whole catalog (cached per catalog), scoped to the
    // page's category/brand/stock filters through `allowed`.
    const engine = getSearchEngine(allProducts);
    searchOutcome = engine.search(params.q, {
      limit: 200,
      allowed: new Set(scopedProducts.map((product) => product.modelNumber)),
    });
    filtered = searchOutcome.products;
    // Only surface category suggestions when the user typed a free-text
    // query — never for category/brand filter selections, so this stays a
    // progressive-enhancement layer on top of the existing filter UX.
    categorySuggestions = engine.matchCategories(searchOutcome, categories, 4);
    if (categorySuggestions.length === 0 && filtered.length === 0) {
      // Nothing in stock matched: offer the categories the query points at
      // across the whole catalog, so the page is never a dead end.
      categorySuggestions = engine.matchCategories(engine.search(params.q, { limit: 60 }), categories, 4);
    }
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

        {params.q && searchOutcome && (
          <SearchResultsLogger query={params.q} count={filtered.length} corrected={searchOutcome.correctedQuery} />
        )}
        {params.q && searchOutcome?.correctedQuery && filtered.length > 0 && (
          <p className="mt-4 text-sm text-graphite-soft/80" role="status">
            מציגים תוצאות עבור <span className="font-bold text-graphite">{searchOutcome.correctedQuery}</span>
            {" "}(חיפשתם &quot;{params.q}&quot;)
          </p>
        )}

        <p className="mt-4 text-sm text-graphite-soft/70">{filtered.length} מוצרים</p>

        {params.q && filtered.length === 0 && (
          <div className="surface-card mt-4 rounded-[1.5rem] p-5 text-graphite md:p-6" role="status">
            <h2 className="text-lg font-bold">לא מצאנו מוצרים עבור &quot;{params.q}&quot;</h2>
            <p className="mt-2 text-sm text-graphite-soft/80">
              נסו מילה אחרת, שם מותג או מק״ט{params.inStock !== "false" ? ", או הציגו גם מוצרים שאזלו מהמלאי" : ""}. אם
              המוצר לא באתר — שלחו לנו ונבדוק אם אפשר להזמין אותו בשבילכם.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {params.inStock !== "false" && (
                <a
                  href={`/products?q=${encodeURIComponent(params.q)}&inStock=false`}
                  className="tap-target inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-brand-blue hover:border-brand-blue/40"
                >
                  חיפוש גם במוצרים שאזלו
                </a>
              )}
              <a
                href={buildWhatsAppUrl(`שלום, חיפשתי באתר "${params.q}" ולא מצאתי. אפשר לבדוק בשבילי?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center rounded-full bg-[#1f9d55] px-4 py-2 text-sm font-bold text-white hover:bg-[#178246]"
              >
                שאלו אותנו בוואטסאפ
              </a>
            </div>
          </div>
        )}

        <div className="mt-3 md:mt-4">
          <ProductGrid products={filtered} />
        </div>
      </div>
    </>
  );
}
