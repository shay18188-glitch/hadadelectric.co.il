import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBrandBySlug, getBrands, getCategories, getProductsByBrand } from "@/lib/base44/catalog";
import { generateBrandMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { getBrandContent } from "@/content/brandContent";

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
  const [brand, products, allCategories] = await Promise.all([
    getBrandBySlug(slug),
    getProductsByBrand(slug),
    getCategories(),
  ]);

  if (!brand) notFound();

  const brandContent = getBrandContent(brand.slug);
  const categorySlugsInBrand = new Set(products.map((p) => p.categorySlug).filter(Boolean));
  const relatedCategories = allCategories.filter((c) => categorySlugsInBrand.has(c.slug));

  return (
    <>
      <Breadcrumbs items={[{ name: "מותגים", path: "/brands" }, { name: brand.name, path: `/brands/${slug}` }]} />

      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">מוצרי {brand.name} בנהריה והצפון</h1>
        {brandContent ? (
          <div className="mt-3 max-w-3xl md:mt-4">
            <SeoTextBlock>
              {brandContent.intro.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </SeoTextBlock>
          </div>
        ) : (
          <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:mt-3 md:text-base">
            קטלוג מוצרי {brand.name} הזמינים אצלנו — בדיקת זמינות באתר, ייעוץ אישי מצוות החנות בנהריה, ומשלוח
            עד בית הלקוח בכל אזור הצפון.
          </p>
        )}

        {relatedCategories.length > 0 && (
          <div className="scroll-x-fade mt-5 flex gap-2 md:mt-6 md:flex-wrap">
            {relatedCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="shrink-0 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <p className="mt-5 text-sm text-graphite-soft/70 md:mt-6">{products.length} מוצרים</p>
        <div className="mt-3 md:mt-4">
          <ProductGrid products={products} emptyMessage="לא נמצאו מוצרים זמינים ממותג זה כרגע." />
        </div>
      </div>
    </>
  );
}
