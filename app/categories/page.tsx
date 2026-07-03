import type { Metadata } from "next";
import { getCategories } from "@/lib/base44/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryTiles } from "@/components/CategoryTiles";
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
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">קטגוריות מוצרי חשמל</h1>
        <p className="mt-3 max-w-2xl text-sm text-graphite-soft/80 md:text-base">
          עיינו במגוון קטגוריות מוצרי החשמל שלנו ובחרו את הקטגוריה המתאימה לכם כדי לגלות את הדגמים הזמינים.
        </p>
        <div className="mt-8">
          <CategoryTiles categories={categories} />
        </div>
      </div>
    </>
  );
}
