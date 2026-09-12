import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/base44/catalog";
import { LocaleCategoryPage } from "@/components/i18n/LocaleCategory";
import { generateCategoryMetadata } from "@/lib/seo/metadata";

// Rendered on demand, like the translated product pages: category listings are
// cheap to regenerate and there is no value in pre-building every locale.
export const revalidate = 10800; // 3 hours

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ inStock?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(decodeURIComponent(slug));
  if (!category) return {};
  return generateCategoryMetadata(category, "ru");
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { inStock } = await searchParams;
  const decodedSlug = decodeURIComponent(slug);

  const category = await getCategoryBySlug(decodedSlug);
  if (!category) notFound();
  if (category.slug !== decodedSlug) permanentRedirect(`/ru/categories/${category.slug}`);

  const [products, categories] = await Promise.all([
    getProductsByCategory(category.slug),
    getCategories(),
  ]);

  return (
    <LocaleCategoryPage
      locale="ru"
      category={category}
      products={products}
      otherCategories={categories.filter((c) => c.slug !== category.slug).slice(0, 10)}
      inStockOnly={inStock === "true"}
    />
  );
}
