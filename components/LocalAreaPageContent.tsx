import Link from "next/link";
import { guidesForCategory } from "@/content/guides";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { CategorySearchBox } from "@/components/CategorySearchBox";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd, localBusinessAreaJsonLd } from "@/lib/schema/jsonld";
import type { LocalPageContent } from "@/content/localPages";
import type { Category } from "@/types/category";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";
import { getNahariyaBuyingPage } from "@/content/nahariyaBuyingPages";
import { BusinessProfiles } from "@/components/BusinessProfiles";

const HOW_IT_WORKS_STEPS = ["בוחרים בקטלוג", "שולחים וואטסאפ", "מתאמים משלוח והתקנה"];

export function LocalAreaPageContent({
  content,
  categories,
  stock,
}: {
  content: LocalPageContent;
  categories: Category[];
  stock?: Record<string, { total: number; inStock: number }>;
}) {
  // Dimension guides for the categories this page highlights, de-duplicated
  // and capped so the module stays a signpost rather than a second sitemap.
  const measureGuides = Array.from(
    new Map(
      content.topCategories
        .flatMap((category) => guidesForCategory(category.slug))
        .filter((guide) => guide.dimensionsTable)
        .map((guide) => [guide.slug, guide])
    ).values()
  ).slice(0, 3);

  return (
    <>
      <Breadcrumbs items={[{ name: content.city, path: content.path }]} />
      <div className="container-page pb-12 md:pb-16">
        <div className="page-intro-shell">
          <p className="section-kicker">שירות מקומי עד הבית</p>
          <h1 className="mt-3">{content.h1}</h1>
          <div className="mt-4 max-w-3xl">
            <SeoTextBlock>
              {content.intro.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </SeoTextBlock>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
          <Link
            href="/products"
            className="tap-target inline-flex items-center justify-center rounded-full bg-graphite px-5 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
          >
            צפו בקטלוג
          </Link>
          <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
          <PhoneButton phone={BUSINESS.phoneDisplay} />
          <Link
            href="/services/delivery"
            className="tap-target inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-graphite hover:bg-surface"
          >
            משלוחים והתקנה
          </Link>
        </div>

        {/* Delivery + installation strip */}
        <div className="mt-6 rounded-2xl border border-line bg-brand-blue-light px-5 py-4 text-sm text-graphite md:mt-8 md:text-[15px]">
          <span className="font-semibold">משלוח והתקנה עד בית הלקוח: </span>
          אנחנו מספקים ומתקינים מוצרי חשמל בבתי לקוחות ב{content.city} ובכל אזור הצפון — בתיאום מראש מול צוות
          החנות, עם יחס אישי מההזמנה ועד שהמוצר עובד אצלכם בבית.
        </div>

        {/* Why us */}
        <section className="mt-10 md:mt-14" aria-labelledby="local-why-heading">
          <h2 id="local-why-heading" className="text-lg font-bold text-graphite md:text-2xl">
            {content.whyUsHeading}
          </h2>
          <div className="mt-3 max-w-3xl md:mt-4">
            <SeoTextBlock>
              {content.whyUs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </SeoTextBlock>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-10 md:mt-14" aria-labelledby="local-how-heading">
          <h2 id="local-how-heading" className="text-lg font-bold text-graphite md:text-2xl">
            איך מזמינים מ{content.city}?
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3 md:gap-4">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <li key={step} className="surface-card rounded-[1.5rem] p-4 md:p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue-light text-sm font-bold text-brand-blue">
                  {index + 1}
                </span>
                <p className="mt-2 text-sm font-semibold text-graphite md:text-[15px]">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 max-w-3xl">
            <SeoTextBlock>
              {content.howItWorks.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </SeoTextBlock>
          </div>
        </section>

        {/* Top categories for this city */}
        <section className="mt-10 md:mt-14" aria-labelledby="local-top-categories-heading">
          <h2 id="local-top-categories-heading" className="text-lg font-bold text-graphite md:text-2xl">
            הקטגוריות המבוקשות ב{content.city}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {content.topCategories.map((category) => (
              <Link
                key={category.slug}
                href={
                  content.city === "נהריה" && getNahariyaBuyingPage(category.slug)
                    ? `/electric-appliances-nahariya/${category.slug}`
                    : `/categories/${category.slug}`
                }
                className="group rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand-blue/40 md:p-5"
              >
                <h3 className="text-[15px] font-bold text-graphite group-hover:text-brand-blue md:text-base">
                  {category.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite-soft/80">{category.note}</p>
                {stock?.[category.slug] && stock[category.slug].total > 0 && (
                  <p className="mt-2 text-xs text-graphite-soft/65">
                    {stock[category.slug].inStock > 0
                      ? `${stock[category.slug].inStock} דגמים זמינים כעת · ${stock[category.slug].total} בקטלוג`
                      : `${stock[category.slug].total} דגמים בקטלוג`}
                  </p>
                )}
              </Link>
            ))}
          </div>
          {stock && (
            <p className="mt-3 text-xs text-graphite-soft/55">
              המספרים מתעדכנים מהקטלוג כמה פעמים ביום. זמינות המלאי כפופה לאישור החנות.
            </p>
          )}
        </section>

        {/* Service areas + NAP */}
        <div className="mt-10 rounded-2xl border border-line bg-surface p-4 md:mt-14 md:p-5">
          <p className="text-sm font-semibold text-graphite">אזורי שירות:</p>
          <p className="mt-1 text-sm text-graphite-soft/80">{content.areasServed.join(" · ")}</p>
          <p className="mt-3 text-xs text-graphite-soft/60">
            {BUSINESS.nameHe} · {BUSINESS.addressStreet}, {BUSINESS.addressCity} · טלפון {BUSINESS.phoneDisplay} ·
            וואטסאפ {BUSINESS.mobileDisplay}
          </p>
          {content.city === "נהריה" && (
            <div className="mt-4 border-t border-line pt-4">
              <BusinessProfiles title="אימות פרטי העסק גם ב־" />
              <p className="mt-3 text-xs text-graphite-soft/55">
                פרטי החנות והתוכן המקומי נבדקו לאחרונה ב־
                <time dateTime="2026-07-23">23 ביולי 2026</time>. מלאי ותנאי אספקה מאומתים לפני הזמנה.
              </p>
            </div>
          )}
        </div>

        {/* Full category search */}
        <section className="mt-10 md:mt-14" aria-labelledby="local-categories-heading">
          <h2 id="local-categories-heading" className="text-lg font-bold text-graphite md:text-2xl">
            כל קטגוריות המוצרים
          </h2>
          <div className="mt-4">
            <CategorySearchBox categories={categories} limit={12} />
          </div>
        </section>

        {/* Local FAQ */}
        {content.faq.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="local-faq-heading">
            <h2 id="local-faq-heading" className="text-lg font-bold text-graphite md:text-2xl">
              שאלות נפוצות — {content.city}
            </h2>
            <div className="mt-3 max-w-3xl md:mt-4">
              <FaqAccordion items={content.faq} />
            </div>
            <JsonLd data={faqJsonLd(content.faq)} />
          </section>
        )}

        {/* Measure-before-you-order.

            Every one of these pages already argues that measurements are the
            risk in a delivery to this city — narrow stairwells in Hadar,
            1960s kitchens, fourth floors without a lift — and then linked to
            no guide that actually carries the measurements. Meanwhile the
            measured-dimension guides are the best-ranking non-brand pages on
            the site (position 6.75 and 7.4). The link is derived from the
            categories this page already highlights, so it stays correct as
            the page's own focus changes. */}
        {measureGuides.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="local-measure-heading">
            <h2 id="local-measure-heading" className="text-lg font-bold text-graphite md:text-2xl">
              מדדו לפני שמזמינים ל{content.city}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-graphite-soft/80">
              המידות הן מה שמפיל הזמנות — לא הדגם. אלה הטבלאות המדודות מהקטלוג לקטגוריות
              המבוקשות באזור, עם מה שצריך למדוד בבית לפני ההזמנה.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {measureGuides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="block rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:text-brand-blue md:p-5"
                  >
                    {guide.title} ←
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <Link href="/tools/niche-fit" className="font-semibold text-brand-blue hover:underline">
                או הזינו את מידות הנישה וראו מה נכנס ←
              </Link>
            </p>
          </section>
        )}

        {/* Related guides */}
        {content.relatedGuides.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="local-guides-heading">
            <h2 id="local-guides-heading" className="text-lg font-bold text-graphite md:text-2xl">
              מדריכים שכדאי לקרוא לפני קנייה
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {content.relatedGuides.map((guide) => (
                <li key={guide.path}>
                  <Link
                    href={guide.path}
                    className="block rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:text-brand-blue md:p-5"
                  >
                    {guide.label} ←
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Nearby areas */}
        {content.nearby.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="local-nearby-heading">
            <h2 id="local-nearby-heading" className="text-lg font-bold text-graphite md:text-2xl">
              אזורי שירות נוספים בסביבה
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.nearby.map((area) => (
                <Link
                  key={area.path}
                  href={area.path}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  מוצרי חשמל ב{area.label}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <JsonLd
        data={localBusinessAreaJsonLd({
          city: content.city,
          path: content.path,
          areasServed: content.areasServed,
          description: content.metaDescription,
        })}
      />
    </>
  );
}
