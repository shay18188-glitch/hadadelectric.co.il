import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import {
  getBrandCategoryCombos,
  getBrands,
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/lib/base44/catalog";
import { generateCategoryMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategorySearchBox } from "@/components/CategorySearchBox";
import { ProductGrid } from "@/components/ProductGrid";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { getCategoryContent } from "@/content/categoryContent";
import { getGuideBySlug } from "@/content/guides";

export const revalidate = 10800; // 3 hours

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
  const decodedSlug = decodeURIComponent(slug);
  const category = await getCategoryBySlug(decodedSlug);

  if (!category) notFound();
  if (category.slug !== decodedSlug) {
    permanentRedirect(`/categories/${category.slug}`);
  }

  const [products, allCategories, allBrands, brandCategoryCombos] = await Promise.all([
    getProductsByCategory(category.slug),
    getCategories(),
    getBrands(),
    getBrandCategoryCombos(),
  ]);

  const content = getCategoryContent(category.slug);
  const relatedGuide = content.guideSlug ? getGuideBySlug(content.guideSlug) : null;
  const categoryBrandCombos = brandCategoryCombos.filter((c) => c.categorySlug === category.slug);
  const relatedBrandSlugs = new Set(products.map((p) => p.brandSlug).filter(Boolean));
  const relatedBrands = allBrands.filter((b) => relatedBrandSlugs.has(b.slug));
  const otherCategories = allCategories.filter((c) => c.slug !== category.slug);

  return (
    <>
      <Breadcrumbs items={[{ name: "קטגוריות", path: "/categories" }, { name: category.name, path: `/categories/${category.slug}` }]} />

      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">{content.h1 ?? `${category.name} בחדד יובל אלקטריק`}</h1>

        <div className="mt-3 max-w-3xl md:mt-4">
          <SeoTextBlock>
            {content.intro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </SeoTextBlock>
        </div>

        {relatedBrands.length > 0 && (
          <div className="scroll-x-fade mt-5 flex gap-2 md:mt-6 md:flex-wrap">
            {relatedBrands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="shrink-0 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        )}

        <p className="mt-5 text-sm text-graphite-soft/70 md:mt-6">{products.length} מוצרים</p>
        <div className="mt-3 md:mt-4">
          <ProductGrid products={products} emptyMessage="לא נמצאו מוצרים זמינים בקטגוריה זו כרגע." />
        </div>

        {content.buyingGuide && (
          <section className="mt-10 md:mt-14" aria-labelledby="category-guide-heading">
            <h2 id="category-guide-heading" className="text-lg font-bold text-graphite md:text-2xl">
              {content.buyingGuide.heading}
            </h2>
            <div className="mt-3 max-w-3xl md:mt-4">
              <SeoTextBlock>
                {content.buyingGuide.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </SeoTextBlock>
            </div>
            {relatedGuide && (
              <div className="mt-4 rounded-2xl border border-line bg-brand-blue-light p-4 md:p-5">
                <p className="text-sm text-graphite">
                  רוצים להעמיק לפני ההחלטה?{" "}
                  <Link href={`/guides/${relatedGuide.slug}`} className="font-semibold text-brand-blue hover:underline">
                    {relatedGuide.title} — למדריך המלא
                  </Link>
                </p>
              </div>
            )}
          </section>
        )}

        <div className="mt-8 rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-graphite md:mt-10 md:text-[15px]">
          <span className="font-semibold">משלוח והתקנה בכל הצפון: </span>
          אנחנו מספקים ומתקינים {category.name} בבית הלקוח — בנהריה, עכו, הקריות, כרמיאל, מעלות-תרשיחא ובכל אזור
          הצפון, בתיאום אישי מול צוות החנות.{" "}
          <Link href="/services/delivery" className="font-semibold text-brand-blue hover:underline">
            לפרטים על משלוחים והתקנה
          </Link>
        </div>

        {categoryBrandCombos.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="category-brands-heading">
            <h2 id="category-brands-heading" className="text-lg font-bold text-graphite md:text-2xl">
              {category.name} לפי מותג
            </h2>
            <p className="mt-2 text-sm text-graphite-soft/80">
              עיינו ב{category.name} של המותגים המובילים אצלנו:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryBrandCombos.map((combo) => (
                <Link
                  key={`${combo.brandSlug}:${combo.categorySlug}`}
                  href={`/brands/${combo.brandSlug}/${combo.categorySlug}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {combo.category} {combo.brand}
                </Link>
              ))}
            </div>
          </section>
        )}

        {content.faq.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="category-faq-heading">
            <h2 id="category-faq-heading" className="text-lg font-bold text-graphite md:text-2xl">
              שאלות נפוצות
            </h2>
            <div className="mt-3 md:mt-4">
              <FaqAccordion items={content.faq} />
            </div>
            <JsonLd data={faqJsonLd(content.faq)} />
          </section>
        )}

        {otherCategories.length > 0 && (
          <section className="mt-8 md:mt-14" aria-labelledby="other-categories-heading">
            <h2 id="other-categories-heading" className="text-lg font-bold text-graphite md:text-2xl">
              קטגוריות נוספות
            </h2>
            <div className="mt-3 md:mt-4">
              <CategorySearchBox categories={otherCategories} limit={8} placeholder="חפשו קטגוריה…" />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
