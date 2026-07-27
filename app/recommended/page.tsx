import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactStrip } from "@/components/ContactStrip";
import { JsonLd } from "@/components/JsonLd";
import { RECOMMENDATION_PAGES } from "@/content/recommendationPages";
import { categoryImageFor } from "@/lib/categoryVisuals";
import { getProducts } from "@/lib/base44/catalog";
import { filterRecommendationProducts } from "@/lib/seo/recommendationProducts";
import { buildMetadata } from "@/lib/seo/metadata";
import { collectionPageJsonLd } from "@/lib/schema/jsonld";

export const revalidate = 10800;

export const metadata: Metadata = buildMetadata({
  title: "מוצרי חשמל מומלצים — השוואות לפי צורך, גודל וסוג",
  description: "עמודי השוואה ממוקדים למוצרי חשמל: מכונות כביסה 9 ו־10 ק״ג, מקררי 4 דלתות, תנורים בנויים, טלוויזיות 65 אינץ׳ ועוד — עם דגמים מהקטלוג הפעיל.",
  path: "/recommended",
});

export default async function RecommendedHubPage() {
  const catalogProducts = await getProducts();
  const cards = RECOMMENDATION_PAGES.map((page) => ({
    page,
    products: filterRecommendationProducts(catalogProducts, page),
  }));
  const publishedCards = cards.filter(({ products }) => products.length >= 4);

  return (
    <>
      <Breadcrumbs items={[{ name: "מומלצים והשוואות", path: "/recommended" }]} />

      <div className="pb-14 md:pb-20">
        <section className="container-page" aria-labelledby="recommendations-title">
          <div className="blueprint-grid relative overflow-hidden rounded-[2rem] bg-[#071a2c] px-6 py-10 text-white shadow-[0_30px_90px_-55px_rgba(7,26,44,.9)] md:px-12 md:py-16 lg:px-16">
            <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-brand-blue/35 blur-3xl" aria-hidden="true" />
            <div className="relative max-w-4xl">
              <p className="section-kicker !text-brand-gold before:!bg-brand-gold">קיצורי דרך לקנייה חכמה</p>
              <h1 id="recommendations-title" className="heading-balance mt-4 text-4xl font-black leading-[1.04] tracking-[-0.045em] md:text-6xl">
                מוצרי חשמל מומלצים — לפי מה שבאמת מחפשים
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
                לא עוד קטגוריה כללית. כל עמוד כאן מרכז דגמים שמתאימים לתכונה ברורה — קיבולת, מבנה, גודל או סוג התקנה — ומסביר איך לבחור ביניהם בלי הבטחות מוגזמות.
              </p>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2.5">{publishedCards.length} השוואות ממוקדות</span>
                <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2.5">רק דגמים מהקטלוג הפעיל</span>
                <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2.5">עדכון קטלוג כל 3 שעות</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-12 md:py-16" aria-labelledby="recommendation-grid-heading">
          <div className="max-w-3xl">
            <p className="section-kicker">בחרו את השאלה שלכם</p>
            <h2 id="recommendation-grid-heading" className="section-title mt-3">השוואות עם כוונת קנייה ברורה</h2>
            <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
              מספר הדגמים בכל כרטיס מחושב מהקטלוג הנוכחי. אם אין מספיק מוצרים תואמים, העמוד אינו מתפרסם — כדי לשמור על תוכן שימושי ואמין.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publishedCards.map(({ page, products }, index) => (
              <Link
                key={page.slug}
                href={`/recommended/${page.slug}`}
                className="group overflow-hidden rounded-[1.75rem] border border-line/80 bg-white shadow-[0_22px_55px_-44px_rgba(10,22,36,.6)] transition hover:-translate-y-1 hover:border-brand-blue/25 hover:shadow-[0_30px_65px_-42px_rgba(18,98,157,.48)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                  <Image
                    src={categoryImageFor(page.categorySlug)}
                    alt={page.shortTitle}
                    fill
                    priority={index < 3}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071a2c]/65 via-transparent to-transparent" />
                  <span className="absolute bottom-4 right-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-black text-brand-blue shadow-sm backdrop-blur">
                    {products.length} דגמים תואמים
                  </span>
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-[11px] font-black tracking-[.08em] text-brand-gold">{page.categoryName}</p>
                  <h3 className="mt-2 text-xl font-black leading-tight text-graphite transition-colors group-hover:text-brand-blue">{page.shortTitle}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-graphite-soft/70">{page.lead}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-blue">
                    להשוואת הדגמים <span aria-hidden="true">←</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-line/70 bg-surface py-12 md:py-16" aria-labelledby="method-heading">
          <div className="container-page grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
            <div>
              <p className="section-kicker">מה פירוש “מומלץ” אצלנו?</p>
              <h2 id="method-heading" className="section-title mt-3">התאמה לצורך, לא דירוג מומצא</h2>
              <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
                איננו מציגים בדיקות מעבדה או חוות דעת שלא ביצענו. ההמלצה מבוססת על התאמת מפרט, מידות ושימוש לבית שלכם, מתוך דגמים שמופיעים בפועל בקטלוג.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "סינון מדויק", "דגם נכנס לעמוד רק אם שם המוצר תואם בבירור לקיבולת, למבנה או לסוג המבוקש."],
                ["02", "שאלות לפני מחיר", "מידות, תשתית והרגלי שימוש נבדקים לפני שממליצים על מפרט או מותג."],
                ["03", "אימות מול החנות", "זמינות והצעה סופית מאומתות מול הצוות; האתר אינו מציג מחיר ישן או מבטיח מלאי."],
              ].map(([number, title, text]) => (
                <article key={number} className="rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
                  <span className="text-xs font-black tracking-[.12em] text-brand-gold">{number}</span>
                  <h3 className="mt-7 font-black text-graphite">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-graphite-soft/70">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="container-page pt-12 md:pt-16"><ContactStrip /></div>
      </div>

      <JsonLd
        data={collectionPageJsonLd({
          name: "מוצרי חשמל מומלצים והשוואות ממוקדות",
          description: "עמודי השוואה לפי קיבולת, מבנה, גודל וסוג התקנה מתוך קטלוג חדד יובל אלקטריק.",
          path: "/recommended",
          items: publishedCards.map(({ page }) => ({ name: page.h1, path: `/recommended/${page.slug}` })),
        })}
      />
    </>
  );
}
