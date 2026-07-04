import type { Metadata } from "next";
import { getCategories } from "@/lib/base44/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategorySearchBox } from "@/components/CategorySearchBox";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 1800;

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
        <h1 className="text-xl font-bold text-graphite md:text-4xl">קטגוריות מוצרי חשמל</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:mt-3 md:text-base">
          חפשו או עיינו במגוון קטגוריות מוצרי החשמל שלנו ובחרו את הקטגוריה המתאימה לכם כדי לגלות את הדגמים הזמינים.
        </p>
        <div className="mt-6 md:mt-8">
          <CategorySearchBox categories={categories} />
        </div>
      </div>
    </>
  );
}
