import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBrandBySlug,
  getBrands,
  getCategories,
  getProductsByBrand,
} from "@/lib/base44/catalog";
import { generateBrandMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { ViewTracker } from "@/components/ViewTracker";
import { getBrandContent } from "@/content/brandContent";
import { buildBrandCategoryPresentation } from "@/content/brandCategorySeo";
import { getSeoBrandCategoryCombos } from "@/lib/seo/brandCategoryCombos";
import { PageHero } from "@/components/PageHero";
import { categoryImageFor } from "@/lib/categoryVisuals";

export const revalidate = 10800; // 3 hours

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return generateBrandMetadata(brand);
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const [brand, products, allCategories, brandCategoryCombos] = await Promise.all([
    getBrandBySlug(slug),
    getProductsByBrand(slug),
    getCategories(),
    getSeoBrandCategoryCombos(),
  ]);

  if (!brand) notFound();

  const brandContent = getBrandContent(brand.slug);
  const brandCombos = brandCategoryCombos.filter((c) => c.brandSlug === brand.slug);
  const categorySlugsInBrand = new Set(products.map((p) => p.categorySlug).filter(Boolean));
  const relatedCategories = allCategories.filter((c) => categorySlugsInBrand.has(c.slug));
  const categoryCounts = products.reduce<Map<string, number>>((counts, product) => {
    if (product.categorySlug) {
      counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
    }
    return counts;
  }, new Map());
  const primaryCategorySlug = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "small-appliances";
  const heroDescription =
    brandContent?.intro[0] ??
    `קטלוג מוצרי ${brand.name} הזמינים אצלנו — בדיקת זמינות באתר, ייעוץ אישי מצוות החנות בנהריה ומשלוח עד בית הלקוח בכל אזור הצפון.`;

  return (
    <>
      <ViewTracker event="brand_view" slug={brand.slug} />
      <Breadcrumbs items={[{ name: "מותגים", path: "/brands" }, { name: brand.name, path: `/brands/${slug}` }]} />

      <div className="container-page pb-12 md:pb-16">
        <PageHero
          eyebrow="מותג מוביל אצלנו בקטלוג"
          title={`מוצרי ${brand.name} בנהריה והצפון`}
          description={heroDescription}
          imageSrc={categoryImageFor(primaryCategorySlug)}
          imageAlt={`מוצרי ${brand.name} לבית`}
          badges={
            <>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">{products.length} מוצרים בקטלוג</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">{relatedCategories.length} קטגוריות</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">בדיקת זמינות וייעוץ אישי</span>
            </>
          }
        />

        {brandContent && brandContent.intro.length > 1 && (
          <div className="surface-card mt-6 max-w-4xl rounded-[1.5rem] p-6 md:mt-8 md:p-8">
            <SeoTextBlock>
              {brandContent.intro.slice(1).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </SeoTextBlock>
          </div>
        )}

        {relatedCategories.length > 0 && (
          <div className="scroll-x-fade mt-5 flex gap-2 md:mt-6 md:flex-wrap">
            {relatedCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-base font-semibold text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {brandCombos.length > 0 && (
          <section className="mt-6 md:mt-8" aria-labelledby="brand-combos-heading">
            <h2 id="brand-combos-heading" className="text-xl font-black text-graphite md:text-2xl">
              קטגוריות מובחרות של {brand.name}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {brandCombos.map((combo) => (
                <Link
                  key={`${combo.brandSlug}:${combo.categorySlug}`}
                  href={`/brands/${combo.brandSlug}/${combo.categorySlug}`}
                  className="rounded-full border border-line bg-white px-4 py-2.5 text-base font-semibold text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {buildBrandCategoryPresentation(combo).headline}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-5 text-base font-medium text-graphite-soft/70 md:mt-6">{products.length} מוצרים</p>
        <div className="mt-3 md:mt-4">
          <ProductGrid products={products} emptyMessage="לא נמצאו מוצרים זמינים ממותג זה כרגע." />
        </div>
      </div>
    </>
  );
}
