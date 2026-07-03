import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBrands,
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/lib/base44/catalog";
import { generateCategoryMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { getCategoryContent } from "@/content/categoryContent";

export const revalidate = 1800;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return generateCategoryMetadata(category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, products, allCategories, allBrands] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
    getCategories(),
    getBrands(),
  ]);

  if (!category) notFound();

  const content = getCategoryContent(slug);
  const relatedBrandSlugs = new Set(products.map((p) => p.brandSlug).filter(Boolean));
  const relatedBrands = allBrands.filter((b) => relatedBrandSlugs.has(b.slug));
  const otherCategories = allCategories.filter((c) => c.slug !== slug).slice(0, 6);

  return (
    <>
      <Breadcrumbs items={[{ name: "קטגוריות", path: "/categories" }, { name: category.name, path: `/categories/${slug}` }]} />

      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">{category.name} בחדד יובל אלקטריק</h1>

        <div className="mt-4 max-w-3xl">
          <SeoTextBlock>
            {content.intro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </SeoTextBlock>
        </div>

        {relatedBrands.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {relatedBrands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm text-graphite-soft/70">{products.length} מוצרים</p>
        <div className="mt-4">
          <ProductGrid products={products} emptyMessage="לא נמצאו מוצרים זמינים בקטגוריה זו כרגע." />
        </div>

        {content.faq.length > 0 && (
          <section className="mt-14" aria-labelledby="category-faq-heading">
            <h2 id="category-faq-heading" className="text-xl font-bold text-graphite md:text-2xl">
              שאלות נפוצות
            </h2>
            <div className="mt-4">
              <FaqAccordion items={content.faq} />
            </div>
            <JsonLd data={faqJsonLd(content.faq)} />
          </section>
        )}

        {otherCategories.length > 0 && (
          <section className="mt-14" aria-labelledby="other-categories-heading">
            <h2 id="other-categories-heading" className="text-xl font-bold text-graphite md:text-2xl">
              קטגוריות נוספות
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
