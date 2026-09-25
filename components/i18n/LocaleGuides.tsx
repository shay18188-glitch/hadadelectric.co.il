import Link from "next/link";
import { GUIDES } from "@/content/guides";
import type { Guide } from "@/content/guides";
import { localizeGuide, localizeCategoryName, hasNativeGuide } from "@/lib/i18n/translated";
import { buildDimensionsTable } from "@/lib/seo/catalogDimensions";
import { DimensionsTable } from "@/components/DimensionsTable";
import { ScreenSizeTable } from "@/components/ScreenSizeTable";
import { LOCALE_HTML_LANG, LOCALE_PREFIX, type Locale } from "@/lib/i18n/locales";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { FaqAccordion } from "@/components/FaqAccordion";
import { GuideCatalogCta } from "@/components/GuideCatalogCta";
import { JsonLd } from "@/components/JsonLd";
import { articleJsonLd, faqJsonLd } from "@/lib/schema/jsonld";

const GUIDES_TEXT: Record<Exclude<Locale, "he">, {
  indexTitle: string;
  indexIntro: string;
  readMore: string;
  faqTitle: string;
  ctaCatalog: string;
  ctaCategory: (name: string) => string;
  mtNote: string;
  answerLabel: string;
  tableCaption: string;
}> = {
  en: {
    indexTitle: "Appliance buying guides",
    indexIntro: "Practical tips to help you choose the right home appliance.",
    readMore: "Read more →",
    faqTitle: "Frequently asked questions",
    ctaCatalog: "Browse our product catalog",
    ctaCategory: (name) => `View ${name} in the catalog`,
    mtNote: "This guide was translated automatically from the Hebrew original.",
    answerLabel: "Short answer",
    tableCaption: "Measured dimensions of the models in our catalog — from the manufacturers' spec sheets",
  },
  ru: {
    indexTitle: "Гиды по выбору бытовой техники",
    indexIntro: "Практичные советы, которые помогут выбрать подходящую технику для дома.",
    readMore: "Читать далее →",
    faqTitle: "Частые вопросы",
    ctaCatalog: "Смотреть каталог товаров",
    ctaCategory: (name) => `Смотреть «${name}» в каталоге`,
    mtNote: "Этот гид переведён автоматически с оригинала на иврите.",
    answerLabel: "Коротко",
    tableCaption: "Замеренные размеры моделей из нашего каталога — по техпаспортам производителей",
  },
};

export function LocaleGuidesIndexPage({ locale }: { locale: Exclude<Locale, "he"> }) {
  const t = GUIDES_TEXT[locale];
  const prefix = LOCALE_PREFIX[locale];
  return (
    <div lang={LOCALE_HTML_LANG[locale]} dir="ltr">
      <div className="container-page py-10 pb-12 md:py-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">{t.indexTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:mt-3 md:text-base">{t.indexIntro}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 md:mt-8 lg:grid-cols-3">
          {GUIDES.map((guide) => {
            const localized = localizeGuide(guide, locale);
            return (
              <Link
                key={guide.slug}
                href={`${prefix}/guides/${guide.slug}`}
                className="tap-scale flex flex-col rounded-2xl border border-line bg-white p-5 transition-shadow md:p-6 md:hover:shadow-md"
              >
                <h2 className="text-base font-bold text-graphite md:text-lg">{localized.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-graphite-soft/80">{localized.description}</p>
                <span className="mt-4 text-sm font-semibold text-brand-blue">{t.readMore}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export async function LocaleGuidePage({ guide, locale }: { guide: Guide; locale: Exclude<Locale, "he"> }) {
  const t = GUIDES_TEXT[locale];
  const prefix = LOCALE_PREFIX[locale];
  const localized = localizeGuide(guide, locale);
  const isTranslated = localized.title !== guide.title;
  // The footnote says the page was machine-translated. On a hand-written
  // edition that would be false, so it is shown only when it is true.
  const isMachineTranslated = isTranslated && !hasNativeGuide(guide.slug, locale);

  // The measured table is the part these pages exist for, and every translated
  // dimensions guide used to render its prose and drop it.
  const dimensionsTable = guide.dimensionsTable ? await buildDimensionsTable(guide.dimensionsTable) : null;

  const categoryName = guide.relatedCategorySlug
    ? localizeCategoryName(guide.relatedCategorySlug, null, locale)
    : null;
  // The translated category page converts (2.09% for /ru/categories over the
  // same 28 days) where the flat product list does not, so send readers there.
  const ctaHref = guide.relatedCategorySlug ? `${prefix}/categories/${guide.relatedCategorySlug}` : `${prefix}/products`;
  const ctaLabel = categoryName ? t.ctaCategory(categoryName) : t.ctaCatalog;

  const splitAt = Math.ceil(localized.sections.length / 2);
  const firstHalf = localized.sections.slice(0, splitAt);
  const secondHalf = localized.sections.slice(splitAt);

  return (
    <div lang={LOCALE_HTML_LANG[locale]} dir="ltr">
      <article className="container-page py-10 pb-12 md:py-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">{localized.title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-graphite-soft/80 md:mt-3 md:text-base">{localized.description}</p>

        {localized.answer && (
          <div className="mt-5 max-w-3xl rounded-[1.25rem] border border-brand-blue/20 bg-brand-blue-light p-4 md:mt-6 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">{t.answerLabel}</p>
            <p className="mt-1.5 text-base font-semibold leading-relaxed text-graphite md:text-lg">{localized.answer}</p>
          </div>
        )}

        <div className="mt-5 max-w-3xl md:mt-6">
          <GuideCatalogCta href={ctaHref} variant="inline" label={ctaLabel} ltr />
        </div>

        <div className="mt-6 max-w-3xl md:mt-8">
          <SeoTextBlock>
            {firstHalf.map((section, index) => (
              <div key={index}>
                {section.heading && <h3>{section.heading}</h3>}
                {section.paragraphs.map((p, pi) => (
                  <p key={pi}>{p}</p>
                ))}
              </div>
            ))}
          </SeoTextBlock>
        </div>

        {(guide.screenSizeTable || dimensionsTable) && (
          <div className="max-w-3xl">
            {guide.screenSizeTable && (
              <ScreenSizeTable
                sizes={guide.screenSizeTable.sizes}
                highlight={guide.screenSizeTable.highlight}
                locale={locale}
              />
            )}
            {dimensionsTable && guide.dimensionsTable && (
              <DimensionsTable
                table={dimensionsTable}
                columns={guide.dimensionsTable.columns}
                caption={t.tableCaption}
                locale={locale}
              />
            )}
          </div>
        )}

        {secondHalf.length > 0 && (
          <div className="mt-6 max-w-3xl md:mt-8">
            <SeoTextBlock>
              {secondHalf.map((section, index) => (
                <div key={index}>
                  {section.heading && <h3>{section.heading}</h3>}
                  {section.paragraphs.map((p, pi) => (
                    <p key={pi}>{p}</p>
                  ))}
                </div>
              ))}
            </SeoTextBlock>
          </div>
        )}

        {localized.faq && localized.faq.length > 0 && (
          <section className="mt-10 max-w-3xl md:mt-12" aria-labelledby="guide-faq-heading">
            <h2 id="guide-faq-heading" className="text-lg font-bold text-graphite md:text-2xl">
              {t.faqTitle}
            </h2>
            <div className="mt-3 md:mt-4">
              <FaqAccordion items={localized.faq} />
            </div>
            <JsonLd data={faqJsonLd(localized.faq)} />
          </section>
        )}

        <div className="mt-8 max-w-3xl md:mt-10">
          <GuideCatalogCta href={ctaHref} variant="inline" label={ctaLabel} ltr />
        </div>

        {isMachineTranslated && <p className="mt-6 text-xs text-graphite-soft/50">{t.mtNote}</p>}
      </article>

      <JsonLd
        data={articleJsonLd({
          title: localized.title,
          description: localized.description,
          path: `${prefix}/guides/${guide.slug}`,
          datePublished: guide.publishedDate,
        })}
      />
    </div>
  );
}
