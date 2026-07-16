import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/base44/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 10800; // 3 hours

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
        <div className="page-intro-shell">
          <p className="section-kicker">המותגים המובילים בעולם</p>
          <h1 className="mt-3">מותגי מוצרי חשמל</h1>
          <p className="mt-4 max-w-2xl text-sm text-graphite-soft/80 md:text-base">בחרו מותג כדי לגלות את כל המוצרים הזמינים בקטלוג שלנו.</p>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-10 lg:grid-cols-5">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group flex min-h-28 flex-col items-center justify-center rounded-2xl border border-line/80 bg-white px-4 py-5 text-center text-base font-black text-graphite shadow-[0_18px_50px_-42px_rgba(11,23,36,.6)] transition duration-300 hover:-translate-y-1 hover:border-brand-gold/50 hover:text-brand-blue"
            >
              {brand.name}
              <span className="mt-1.5 text-xs font-medium text-graphite-soft/50">{brand.productCount} מוצרים</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
