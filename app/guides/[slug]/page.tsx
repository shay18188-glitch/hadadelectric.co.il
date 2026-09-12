import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuideBySlug } from "@/content/guides";
import { DimensionsTable } from "@/components/DimensionsTable";
import { buildDimensionsTable } from "@/lib/seo/catalogDimensions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { GuideCatalogCta } from "@/components/GuideCatalogCta";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CategoryTiles } from "@/components/CategoryTiles";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { articleJsonLd, faqJsonLd } from "@/lib/schema/jsonld";
import { buildMetadata, withStoreSuffix } from "@/lib/seo/metadata";
import { translationsForPath } from "@/lib/i18n/locales";
import { hasGuideTranslation } from "@/lib/i18n/translated";
import { getCategories, getCategoryBySlug } from "@/lib/base44/catalog";
import { categoryImageFor } from "@/lib/categoryVisuals";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  // Only advertise locale alternates that are actually translated; the en/ru
  // variants of a brand-new guide are noindexed until the translation job runs.
  const alternates = translationsForPath(`/guides/${slug}`);
  const translations = alternates
    ? {
        he: alternates.he,
        ...(hasGuideTranslation(slug, "en") ? { en: alternates.en } : {}),
        ...(hasGuideTranslation(slug, "ru") ? { ru: alternates.ru } : {}),
      }
    : undefined;

  return buildMetadata({
    title: withStoreSuffix(guide.title),
    description: guide.description,
    path: `/guides/${slug}`,
    absoluteTitle: true,
    translations,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const [relatedCategory, allCategories, dimensionsTable] = await Promise.all([
    guide.relatedCategorySlug ? getCategoryBySlug(guide.relatedCategorySlug) : Promise.resolve(null),
    guide.catalogCategorySlugs?.length ? getCategories() : Promise.resolve([]),
    guide.dimensionsTable ? buildDimensionsTable(guide.dimensionsTable) : Promise.resolve(null),
  ]);

  // Sibling guides, resolved here so an unknown slug is dropped rather than
  // rendering a dead link.
  const relatedGuides = (guide.relatedGuideSlugs ?? [])
    .map((relatedSlug) => getGuideBySlug(relatedSlug))
    .filter((related): related is NonNullable<typeof related> => Boolean(related));

  // For general guides: resolve the relevant categories, preserving the
  // authored order and skipping any that aren't live in the catalog.
  const catalogCategories = (guide.catalogCategorySlugs ?? [])
    .map((s) => allCategories.find((c) => c.slug === s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // CTA target: the related category catalog, or the full catalog as fallback.
  const ctaHref = relatedCategory ? `/categories/${relatedCategory.slug}` : "/products";
  const ctaCategoryName = relatedCategory?.name;
  const heroImage = categoryImageFor(guide.relatedCategorySlug ?? guide.catalogCategorySlugs?.[0] ?? "small-appliances");

  // Split the article so a mid-content CTA can sit between two prose blocks
  // (outside SeoTextBlock, which styles descendant <p>/<h3>).
  const splitAt = Math.ceil(guide.sections.length / 2);
  const firstHalf = guide.sections.slice(0, splitAt);
  const secondHalf = guide.sections.slice(splitAt);

  return (
    <>
      <Breadcrumbs items={[{ name: "מדריכים", path: "/guides" }, { name: guide.title, path: `/guides/${slug}` }]} />

      <article className="container-page pb-12 md:pb-16">
        <header className="relative isolate flex min-h-[38rem] items-end overflow-hidden rounded-[2rem] bg-[#071a2c] text-white shadow-[0_38px_95px_-48px_rgba(7,26,44,0.9)] md:min-h-[34rem] md:items-center md:rounded-[2.75rem]">
          <Image
            src={heroImage}
            alt={`מדריך ${guide.title}`}
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 90vw"
            className="-z-30 object-cover object-center"
          />
          <div className="absolute inset-0 -z-20 bg-gradient-to-t from-[#061625] via-[#061625]/62 to-transparent md:bg-gradient-to-l md:from-[#061625]/98 md:via-[#061625]/78 md:to-[#061625]/5" />
          <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-black/22 to-transparent md:hidden" />

          <div className="w-full px-6 pb-8 pt-40 sm:px-9 sm:pb-10 md:max-w-[58%] md:px-12 md:py-14 lg:px-16">
            <p className="text-sm font-bold tracking-[0.13em] text-brand-gold">מדריך הבחירה של חדד</p>
            <h1 className="heading-balance mt-3 text-[2.35rem] font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl md:text-[3.5rem] lg:text-[4rem]">
              {guide.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/82 md:text-lg md:leading-9">{guide.description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={ctaHref}
                className="tap-target group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-brand-blue-dark shadow-[0_18px_38px_-20px_rgba(0,0,0,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-light sm:w-auto"
              >
                {ctaCategoryName ? `למוצרי ${ctaCategoryName}` : "לצפייה בקטלוג"}
                <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
              </Link>
              <WhatsAppButton
                message={buildWhatsAppGeneralMessage()}
                label="התייעצות בוואטסאפ"
                variant="outline"
                size="lg"
                trackAs="whatsapp_click_header"
                className="w-full !border-white/25 !bg-white/10 !text-white !shadow-none backdrop-blur-md hover:!bg-white/18 sm:w-auto"
              />
            </div>
          </div>
        </header>

        <div className="mt-8 grid max-w-6xl gap-7 lg:grid-cols-[minmax(0,52rem)_20rem] lg:items-start md:mt-10">
          {/* min-w-0 is load-bearing. A grid item defaults to min-width:auto,
              which sizes it to its content's min-content width — and the
              measured tables below carry min-w-[34rem]. That 544px floor
              propagated up through this card and widened the whole document:
              every guide with a dimensions table scrolled sideways on a phone,
              including /guides/oven-dimensions, which takes 25.9 impressions a
              day at position 7.4 with 64% of the site's clicks coming from
              mobile. Allowing this item to shrink lets the table's own
              overflow-x-auto wrapper do the scrolling instead. */}
          <div className="min-w-0 surface-card rounded-[1.75rem] p-6 sm:p-8 md:rounded-[2rem] md:p-10">
            <div className="mb-7 flex flex-wrap items-center gap-2 border-b border-line/70 pb-5 text-xs font-medium text-graphite-soft/58">
              <span className="rounded-full bg-brand-blue-light px-3 py-1.5 font-bold text-brand-blue">מדריך מעשי</span>
              <span>{guide.sections.length} נושאים שיעזרו לכם לבחור נכון</span>
            </div>

            <SeoTextBlock>
              {firstHalf.map((section, index) => (
                <section key={index} className="border-b border-line/65 pb-7 last:border-0 last:pb-0 md:pb-9">
                  {section.heading && <h3>{section.heading}</h3>}
                  {section.paragraphs.map((p, pi) => (
                    <p key={pi}>{p}</p>
                  ))}
                </section>
              ))}
            </SeoTextBlock>

            {dimensionsTable && guide.dimensionsTable && (
              <>
                <DimensionsTable
                  table={dimensionsTable}
                  columns={guide.dimensionsTable.columns}
                  caption={guide.dimensionsTable.caption}
                />
                {/* The table answers "how big is this category". Someone holding
                    a tape measure has the inverse question, so hand them the
                    tool that takes their niche and returns what fits. */}
                <p className="mt-3 text-sm">
                  <Link href="/tools/niche-fit" className="font-semibold text-brand-blue hover:underline">
                    יש לכם כבר את מידות הנישה? בדקו מה נכנס ←
                  </Link>
                </p>
              </>
            )}

            {secondHalf.length > 0 && (
              <div className="my-8 rounded-[1.5rem] border border-brand-blue/12 bg-brand-blue-light/35 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 md:my-10 md:p-6">
                <div>
                  <p className="text-base font-black text-graphite">רוצים לראות את הדגמים המתאימים?</p>
                  <p className="mt-1 text-sm leading-6 text-graphite-soft/68">עברו ישירות לקטלוג ובדקו את המבחר הזמין.</p>
                </div>
                <div className="mt-4 shrink-0 sm:mt-0">
                  <GuideCatalogCta
                    href={ctaHref}
                    variant="inline"
                    label={ctaCategoryName ? `לדגמי ${ctaCategoryName}` : "לכל המוצרים"}
                  />
                </div>
              </div>
            )}

            {secondHalf.length > 0 && (
              <SeoTextBlock>
                {secondHalf.map((section, index) => (
                  <section key={index} className="border-b border-line/65 pb-7 last:border-0 last:pb-0 md:pb-9">
                    {section.heading && <h3>{section.heading}</h3>}
                    {section.paragraphs.map((p, pi) => (
                      <p key={pi}>{p}</p>
                    ))}
                  </section>
                ))}
              </SeoTextBlock>
            )}
          </div>

          <aside className="rounded-[1.75rem] border border-line/75 bg-white p-6 shadow-[0_24px_65px_-45px_rgba(10,22,36,0.6)] lg:sticky lg:top-32" aria-label="עזרה בבחירת מוצר">
            <p className="section-kicker">נשארה שאלה?</p>
            <h2 className="mt-3 text-xl font-black leading-tight text-graphite">מקבלים החלטה עם איש מקצוע</h2>
            <p className="mt-3 text-base leading-7 text-graphite-soft/72">
              ספרו לנו מה חשוב לכם ונעזור לצמצם את האפשרויות לדגמים שבאמת מתאימים לבית ולתקציב.
            </p>
            <ul className="mt-5 space-y-3 border-y border-line/70 py-5 text-base text-graphite-soft/78">
              {["ייעוץ אישי מחנות בנהריה", "בדיקת זמינות מהירה", "משלוח והתקנה בכל הצפון"].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-xs font-black text-brand-blue">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <WhatsAppButton
              message={buildWhatsAppGeneralMessage()}
              label="דברו איתנו בוואטסאפ"
              trackAs="whatsapp_click_header"
              className="mt-5 w-full"
            />
            <div className="mt-3">
              <GuideCatalogCta
                href={ctaHref}
                variant="inline"
                label={ctaCategoryName ? `למוצרי ${ctaCategoryName}` : "לקטלוג המלא"}
              />
            </div>
          </aside>
        </div>

        {guide.faq && guide.faq.length > 0 && (
          <section className="mt-10 max-w-4xl md:mt-14" aria-labelledby="guide-faq-heading">
            <h2 id="guide-faq-heading" className="text-2xl font-black text-graphite md:text-3xl">
              שאלות נפוצות
            </h2>
            <p className="mt-2 text-base text-graphite-soft/68">התשובות הקצרות לשאלות שחוזרות לפני רכישה.</p>
            <div className="mt-5">
              <FaqAccordion items={guide.faq} />
            </div>
            <JsonLd data={faqJsonLd(guide.faq)} />
          </section>
        )}

        {relatedGuides.length > 0 && (
          <section className="mt-10 max-w-4xl md:mt-14" aria-labelledby="related-guides-heading">
            <h2 id="related-guides-heading" className="text-2xl font-black text-graphite md:text-3xl">
              מדריכים שממשיכים מכאן
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {relatedGuides.map((related) => (
                <li key={related.slug}>
                  <Link
                    href={`/guides/${related.slug}`}
                    className="block h-full rounded-[1.25rem] border border-line/75 bg-white p-5 transition hover:border-brand-blue/35 hover:shadow-[0_18px_45px_-35px_rgba(10,22,36,0.6)]"
                  >
                    <p className="text-base font-black leading-snug text-graphite">{related.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-graphite-soft/70">{related.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA #3 — bottom. General guides get a designed "matching catalog"
            category grid; single-topic guides get the focused banner. */}
        {catalogCategories.length > 0 ? (
          <section className="mt-10 md:mt-14" aria-labelledby="guide-catalog-heading">
            <h2 id="guide-catalog-heading" className="text-lg font-bold text-graphite md:text-2xl">
              צפו בקטלוג המתאים
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-graphite-soft/80 md:text-lg md:leading-8">
              כל מה שהזכרנו במדריך מחכה לכם בקטלוג — בדקו זמינות, קבלו ייעוץ אישי, ומשלוח והתקנה עד בית הלקוח
              בכל אזור הצפון.
            </p>
            <div className="mt-4 md:mt-5">
              <CategoryTiles categories={catalogCategories} />
            </div>
            <div className="mt-5 max-w-3xl">
              <GuideCatalogCta href="/products" variant="inline" label="לקטלוג המלא של כל המוצרים" />
            </div>
          </section>
        ) : (
          <div className="max-w-3xl">
            <GuideCatalogCta
              href={ctaHref}
              variant="banner"
              categoryName={ctaCategoryName}
              imageSrc={heroImage}
              label={ctaCategoryName ? `למוצרי ${ctaCategoryName}` : "לקטלוג המלא"}
            />
          </div>
        )}
      </article>

      <JsonLd
        data={articleJsonLd({
          title: guide.title,
          description: guide.description,
          path: `/guides/${slug}`,
          datePublished: guide.publishedDate,
        })}
      />
    </>
  );
}
