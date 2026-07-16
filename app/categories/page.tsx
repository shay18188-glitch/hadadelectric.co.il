import type { Metadata } from "next";
import { getCategories } from "@/lib/base44/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategorySearchBox } from "@/components/CategorySearchBox";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = buildMetadata({
  title: "קטגוריות מוצרי חשמל",
  description: "כל קטגוריות מוצרי החשמל בחדד יובל אלקטריק — מקררים, מכונות כביסה, תנורים, טלוויזיות, מזגנים ועוד.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <Breadcrumbs items={[{ name: "קטגוריות", path: "/categories" }]} />
      <div className="container-page pb-12 md:pb-16">
        <div className="page-intro-shell">
          <p className="section-kicker">כל מה שהבית צריך</p>
          <h1 className="mt-3">קטגוריות מוצרי חשמל</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite-soft/80 md:text-base">
            חפשו או עיינו במגוון קטגוריות מוצרי החשמל שלנו ובחרו את הקטגוריה המתאימה לכם כדי לגלות את הדגמים הזמינים.
          </p>
        </div>
        <div className="mt-7 md:mt-10">
          <CategorySearchBox categories={categories} />
        </div>
      </div>
    </>
  );
}
