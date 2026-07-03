import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBrandBySlug, getBrands, getCategories, getProductsByBrand } from "@/lib/base44/catalog";
import { generateBrandMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";

export const revalidate = 1800;

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

  const categorySlugsInBrand = new Set(products.map((p) => p.categorySlug).filter(Boolean));
  const relatedCategories = allCategories.filter((c) => categorySlugsInBrand.has(c.slug));

  return (
    <>
      <Breadcrumbs items={[{ name: "מותגים", path: "/brands" }, { name: brand.name, path: `/brands/${slug}` }]} />

      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">מוצרי {brand.name} בחדד יובל אלקטריק</h1>
        <p className="mt-3 max-w-2xl text-sm text-graphite-soft/80 md:text-base">
          קטלוג מוצרי {brand.name} הזמינים אצלנו, עם אפשרות לבדוק זמינות ולפנות לצוות החנות בנהריה להזמנה או ייעוץ.
        </p>

        {relatedCategories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {relatedCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm text-graphite-soft/70">{products.length} מוצרים</p>
        <div className="mt-4">
          <ProductGrid products={products} emptyMessage="לא נמצאו מוצרים זמינים ממותג זה כרגע." />
        </div>
      </div>
    </>
  );
}
