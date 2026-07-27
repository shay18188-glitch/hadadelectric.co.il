import type { Metadata } from "next";
import Image from "next/image";
import { getCategories } from "@/lib/base44/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategorySearchBox } from "@/components/CategorySearchBox";
import { buildMetadata } from "@/lib/seo/metadata";
import { categoryImageFor } from "@/lib/categoryVisuals";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = buildMetadata({
  title: "קטגוריות מוצרי חשמל",
  description: "כל קטגוריות מוצרי החשמל בחדד יובל אלקטריק — מקררים, מכונות כביסה, תנורים, טלוויזיות, מזגנים ועוד.",
  path: "/categories",
});

const CATEGORY_HERO_VISUALS = [
  { slug: "refrigerators", label: "מקררים" },
  { slug: "washing-machines", label: "כביסה" },
  { slug: "tvs", label: "טלוויזיות" },
] as const;

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <Breadcrumbs items={[{ name: "קטגוריות", path: "/categories" }]} />
      <div className="container-page pb-12 md:pb-16">
        <section className="blueprint-grid relative isolate overflow-hidden rounded-[2rem] bg-[#071a2c] px-6 pb-8 pt-10 text-white shadow-[0_38px_90px_-52px_rgba(7,26,44,0.92)] sm:px-9 md:grid md:min-h-[27rem] md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-10 md:rounded-[2.75rem] md:px-12 md:py-12 lg:px-16">
          <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-brand-blue/35 blur-3xl" aria-hidden="true" />
          <div className="relative z-10">
            <p className="section-kicker !text-brand-gold">כל מה שהבית צריך</p>
            <h1 className="heading-balance mt-4 text-[2.75rem] font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl md:text-[3.8rem] lg:text-[4.4rem]">
              קטגוריות מוצרי חשמל
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/78 md:text-lg md:leading-9">
              כל מוצרי החשמל לבית, מסודרים בצורה ברורה כדי שתגיעו לדגם הנכון במהירות ובביטחון.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5 text-sm font-semibold text-white/82">
              <span className="rounded-full border border-white/14 bg-white/8 px-3.5 py-2 backdrop-blur-sm">{categories.length} קטגוריות לבחירה</span>
              <span className="rounded-full border border-white/14 bg-white/8 px-3.5 py-2 backdrop-blur-sm">ייעוץ אישי בנהריה</span>
            </div>
          </div>

          <div className="relative mt-9 h-48 md:mt-0 md:h-[21rem]">
            <div className="grid h-full grid-cols-3 gap-2.5 sm:gap-3">
              {CATEGORY_HERO_VISUALS.map((item, index) => (
                <div
                  key={item.slug}
                  className={`relative overflow-hidden rounded-[1.4rem] border border-white/12 shadow-2xl ${index === 1 ? "translate-y-4" : "-translate-y-1"}`}
                >
                  <Image
                    src={categoryImageFor(item.slug)}
                    alt={item.label}
                    fill
                    sizes="(max-width: 768px) 30vw, 14vw"
                    className="object-cover"
                    loading="eager"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#071a2c]/78 via-transparent to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-xs font-bold sm:p-4 sm:text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="relative z-10 -mt-5 px-2 md:-mt-7 md:px-10">
          <CategorySearchBox categories={categories} />
        </div>
      </div>
    </>
  );
}
