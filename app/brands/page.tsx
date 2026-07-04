import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/base44/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 1800;

export const metadata: Metadata = buildMetadata({
  title: "מותגי מוצרי חשמל",
  description: "כל מותגי מוצרי החשמל הזמינים בקטלוג של חדד יובל אלקטריק בנהריה.",
  path: "/brands",
});

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <>
      <Breadcrumbs items={[{ name: "מותגים", path: "/brands" }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">מותגי מוצרי חשמל</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:mt-3 md:text-base">
          בחרו מותג כדי לגלות את כל המוצרים הזמינים בקטלוג שלנו.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 md:mt-8 md:gap-3">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="tap-target rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:bg-brand-blue-light hover:text-brand-blue md:px-5"
            >
              {brand.name}
              <span className="ms-1.5 text-xs text-graphite-soft/50">({brand.productCount})</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
