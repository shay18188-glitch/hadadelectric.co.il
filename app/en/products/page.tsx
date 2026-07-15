import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/base44/catalog";
import { LocaleProductsPage } from "@/components/i18n/LocaleCatalog";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const revalidate = 10800; // 3 hours

interface SearchParams {
  category?: string;
  inStock?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(params.category || params.inStock);
  return buildMetadata({
    title: "Home Appliance Catalog — Hadad Electric, Nahariya",
    description:
      "Browse the Hadad Electric appliance catalog — refrigerators, washing machines, ovens, TVs and more. Check availability and order directly on WhatsApp or by phone, in English.",
    path: "/en/products",
    locale: "en",
    translations: TRANSLATED_PATHS["/products"],
    noindex: hasFilters,
  });
}

export default async function EnglishProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <LocaleProductsPage
      locale="en"
      products={products}
      categories={categories}
      activeCategory={params.category}
      inStockOnly={params.inStock === "true"}
    />
  );
}
