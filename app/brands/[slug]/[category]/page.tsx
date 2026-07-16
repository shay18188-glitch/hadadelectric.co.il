import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBrandCategoryCombos,
  getProductsByBrandAndCategory,
} from "@/lib/base44/catalog";
import { generateBrandCategoryMetadata } from "@/lib/seo/metadata";
import {
  BRAND_CATEGORY_MIN_PRODUCTS,
  buildBrandCategoryContent,
  getCuratedBrandCategoryContent,
  type BrandCategoryContent,
} from "@/content/brandCategoryContent";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { categoryImageFor } from "@/lib/categoryVisuals";

export const revalidate = 10800; // 3 hours

interface BrandCategoryPageProps {
  params: Promise<{ slug: string; category: string }>;
}

export async function generateStaticParams() {
  const combos = await getBrandCategoryCombos(BRAND_CATEGORY_MIN_PRODUCTS);
  return combos.map((c) => ({ slug: c.brandSlug, category: c.categorySlug }));
}

export async function generateMetadata({ params }: BrandCategoryPageProps): Promise<Metadata> {
  const { slug, category } = await params;
  const combos = await getBrandCategoryCombos(BRAND_CATEGORY_MIN_PRODUCTS);
  const combo = combos.find((c) => c.brandSlug === slug && c.categorySlug === category);
  if (!combo) return {};
  return generateBrandCategoryMetadata(combo);
}

export default async function BrandCategoryPage({ params }: BrandCategoryPageProps) {
  const { slug, category } = await params;
  const combos = await getBrandCategoryCombos(BRAND_CATEGORY_MIN_PRODUCTS);
  const combo = combos.find((c) => c.brandSlug === slug && c.categorySlug === category);

  // Never render a thin page for a combo below the product threshold.
  if (!combo) notFound();

  const products = await getProductsByBrandAndCategory(slug, category);
  if (products.length < BRAND_CATEGORY_MIN_PRODUCTS) notFound();

  const content: BrandCategoryContent =
    getCuratedBrandCategoryContent(slug, category) ??
    buildBrandCategoryContent({
      brand: combo.brand,
      brandSlug: combo.brandSlug,
      category: combo.category,
      productCount: combo.productCount,
      sampleNames: products.map((p) => p.name),
    });

  const relatedBrandCombos = combos
    .filter((c) => c.categorySlug === category && c.brandSlug !== slug)
    .slice(0, 6);
  const otherBrandCombos = combos
    .filter((c) => c.brandSlug === slug && c.categorySlug !== category)
    .slice(0, 6);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "מותגים", path: "/brands" },
          { name: combo.brand, path: `/brands/${slug}` },
          { name: combo.category, path: `/brands/${slug}/${category}` },
        ]}
      />

      <div className="container-page pb-12 md:pb-16">
        <div className="page-intro-shell grid gap-6 p-0 md:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-center px-6 py-8 md:px-12 md:py-12">
            <p className="section-kicker">{combo.brand} · קולקציה נבחרת</p>
            <h1 className="heading-balance mt-3 text-3xl font-black leading-[1.05] tracking-[-0.04em] text-graphite md:text-5xl">{combo.category} {combo.brand} בנהריה והצפון</h1>
            <div className="mt-4 max-w-3xl"><SeoTextBlock>{content.intro.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</SeoTextBlock></div>
          </div>
          <div className="relative min-h-64 overflow-hidden md:min-h-[23rem]">
            <Image src={categoryImageFor(category)} alt={`${combo.category} ${combo.brand}`} fill priority sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
          <Link
            href={`/brands/${slug}`}
            className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
          >
            כל מוצרי {combo.brand}
          </Link>
          <Link
            href={`/categories/${category}`}
            className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
          >
            כל ה{combo.category}
          </Link>
        </div>

        <p className="mt-5 text-sm text-graphite-soft/70 md:mt-6">{products.length} מוצרים</p>
        <div className="mt-3 md:mt-4">
          <ProductGrid products={products} emptyMessage="לא נמצאו מוצרים זמינים בצירוף זה כרגע." />
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-graphite md:mt-10 md:text-[15px]">
          <span className="font-semibold">משלוח והתקנה בכל הצפון: </span>
          אנחנו מספקים ומתקינים {combo.category} {combo.brand} בבית הלקוח — בנהריה, עכו, הקריות, כרמיאל ובכל אזור
          הצפון, בתיאום אישי מול צוות החנות.{" "}
          <Link href="/services/delivery" className="font-semibold text-brand-blue hover:underline">
            לפרטים על משלוחים והתקנה
          </Link>
        </div>

        {content.faq.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="bc-faq-heading">
            <h2 id="bc-faq-heading" className="text-lg font-bold text-graphite md:text-2xl">
              שאלות נפוצות — {combo.category} {combo.brand}
            </h2>
            <div className="mt-3 max-w-3xl md:mt-4">
              <FaqAccordion items={content.faq} />
            </div>
            <JsonLd data={faqJsonLd(content.faq)} />
          </section>
        )}

        {relatedBrandCombos.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="bc-related-heading">
            <h2 id="bc-related-heading" className="text-lg font-bold text-graphite md:text-2xl">
              {combo.category} ממותגים נוספים
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedBrandCombos.map((c) => (
                <Link
                  key={`${c.brandSlug}:${c.categorySlug}`}
                  href={`/brands/${c.brandSlug}/${c.categorySlug}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {c.category} {c.brand}
                </Link>
              ))}
            </div>
          </section>
        )}

        {otherBrandCombos.length > 0 && (
          <section className="mt-8 md:mt-12" aria-labelledby="bc-other-heading">
            <h2 id="bc-other-heading" className="text-lg font-bold text-graphite md:text-2xl">
              קטגוריות נוספות של {combo.brand}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherBrandCombos.map((c) => (
                <Link
                  key={`${c.brandSlug}:${c.categorySlug}`}
                  href={`/brands/${c.brandSlug}/${c.categorySlug}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {c.category} {c.brand}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
