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
    title: "Каталог бытовой техники — Hadad Electric, Нагария",
    description:
      "Каталог бытовой техники Hadad Electric — холодильники, стиральные машины, духовые шкафы, телевизоры и не только. Проверка наличия и заказ в WhatsApp или по телефону, по-русски.",
    path: "/ru/products",
    locale: "ru",
    translations: TRANSLATED_PATHS["/products"],
    noindex: hasFilters,
  });
}

export default async function RussianProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <LocaleProductsPage
      locale="ru"
      products={products}
      categories={categories}
      activeCategory={params.category}
      inStockOnly={params.inStock === "true"}
    />
  );
}
