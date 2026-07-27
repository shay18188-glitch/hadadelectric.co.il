import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/base44/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBrandCategoryPresentation } from "@/content/brandCategorySeo";
import { getSeoBrandCategoryCombos } from "@/lib/seo/brandCategoryCombos";
import { PageHero } from "@/components/PageHero";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = buildMetadata({
  title: "מותגי מוצרי חשמל לפי קטגוריה — דגמים והשוואה",
  description: "מזגני אלקטרה, שואבים רובוטיים Dreame, מדיחי Bosch, טלוויזיות LG וסמסונג ועוד — עמודי מותג ומוצר עם כל הדגמים, זמינות ומדריכי בחירה.",
  path: "/brands",
});

export default async function BrandsPage() {
  const [brands, combinations] = await Promise.all([
    getBrands(),
    getSeoBrandCategoryCombos(),
  ]);
  const featuredCombinations = combinations.slice(0, 12);

  return (
    <>
      <Breadcrumbs items={[{ name: "מותגים", path: "/brands" }]} />
      <div className="container-page pb-12 md:pb-16">
        <PageHero
          eyebrow="מותג × מוצר · השוואה מדויקת יותר"
          title="מותגי מוצרי חשמל"
          description="בחרו מותג כדי לראות את כל מוצריו, או היכנסו ישר לשילוב המבוקש — מזגני אלקטרה, שואבים רובוטיים Dreame, מדיחי Bosch, טלוויזיות LG ועוד."
          imageSrc="/images/redesign/home-living.png"
          imageAlt="סלון מודרני עם טלוויזיה ומוצרי חשמל ממותגים מובילים"
          imageClassName="object-[58%_center] md:object-center"
          badges={
            <>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">{brands.length} מותגים בקטלוג</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">{combinations.length} עמודי השוואה</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">דגמים אמיתיים וזמינות עדכנית</span>
            </>
          }
        />

        <section className="mt-8 md:mt-12" aria-labelledby="popular-brand-products-heading">
          <div className="max-w-3xl">
            <p className="section-kicker">החיפושים המסחריים הבולטים</p>
            <h2 id="popular-brand-products-heading" className="section-title mt-3">שילובי מותג ומוצר שכדאי להתחיל מהם</h2>
            <p className="mt-3 text-sm leading-7 text-graphite-soft/72 md:text-base">
              הבחירה מבוססת על ניסוחי חיפוש נפוצים בישראל, כוונת קנייה ומבחר מספיק להשוואה באתר — לא על יצירת עמוד אוטומטי לכל צירוף אפשרי.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredCombinations.map((combo, index) => {
              const presentation = buildBrandCategoryPresentation(combo);
              return (
                <Link
                  key={`${combo.brandSlug}:${combo.categorySlug}`}
                  href={`/brands/${combo.brandSlug}/${combo.categorySlug}`}
                  className="group flex min-h-52 flex-col rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_20px_55px_-46px_rgba(11,23,36,.65)] transition duration-300 hover:-translate-y-1 hover:border-brand-gold/45"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#071a2c] text-[11px] font-black text-white">{String(index + 1).padStart(2, "0")}</span>
                    <span className="rounded-full bg-success-bg px-3 py-1.5 text-xs font-black text-success">{combo.productCount} דגמים</span>
                  </div>
                  <h3 className="mt-8 text-xl font-black leading-tight text-graphite transition-colors group-hover:text-brand-blue md:text-2xl">{presentation.headline}</h3>
                  <p className="mt-3 text-sm leading-6 text-graphite-soft/68 md:text-base">כל הדגמים, מדריך בחירה, זמינות והצעת מחיר</p>
                  <span className="mt-auto pt-5 text-sm font-black text-brand-blue">לעמוד ההשוואה ←</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-line bg-surface p-5 md:mt-14 md:p-7" aria-labelledby="all-brand-products-heading">
          <h2 id="all-brand-products-heading" className="text-xl font-black text-graphite md:text-2xl">כל עמודי המותג והמוצר</h2>
          <p className="mt-2 text-base leading-7 text-graphite-soft/70">קישורים ישירים לכל העמודים שנבחרו ונכתבו באופן ידני.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {combinations.map((combo) => {
              const presentation = buildBrandCategoryPresentation(combo);
              return (
                <Link
                  key={`${combo.brandSlug}:${combo.categorySlug}`}
                  href={`/brands/${combo.brandSlug}/${combo.categorySlug}`}
                  className="rounded-full border border-line bg-white px-4 py-2.5 text-base font-bold text-graphite transition hover:border-brand-blue/35 hover:text-brand-blue"
                >
                  {presentation.headline} · {combo.productCount}
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mt-12 md:mt-16">
          <p className="section-kicker">עיון לפי יצרן</p>
          <h2 className="section-title mt-3">כל המותגים בקטלוג</h2>
          <p className="mt-3 text-base text-graphite-soft/70">בחרו מותג כדי לראות את כל המוצרים שלו מכל הקטגוריות.</p>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-10 lg:grid-cols-5">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border border-line/80 bg-white px-4 py-6 text-center text-lg font-black text-graphite shadow-[0_18px_50px_-42px_rgba(11,23,36,.6)] transition duration-300 hover:-translate-y-1 hover:border-brand-gold/50 hover:text-brand-blue md:text-xl"
            >
              {brand.name}
              <span className="mt-2 text-sm font-medium text-graphite-soft/55">{brand.productCount} מוצרים</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
