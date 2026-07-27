import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BusinessProfiles } from "@/components/BusinessProfiles";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { PhoneButton } from "@/components/PhoneButton";
import { ProductGrid } from "@/components/ProductGrid";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  getNahariyaBuyingPage,
  NAHARIYA_BUYING_PAGES,
} from "@/content/nahariyaBuyingPages";
import { RECOMMENDATION_PAGES } from "@/content/recommendationPages";
import { getProductsByCategory } from "@/lib/base44/catalog";
import { categoryImageFor } from "@/lib/categoryVisuals";
import {
  collectionPageJsonLd,
  faqJsonLd,
  localBusinessAreaJsonLd,
} from "@/lib/schema/jsonld";
import { prioritizeProductsWithImages } from "@/lib/search/productSorting";
import { buildMetadata } from "@/lib/seo/metadata";
import { BUSINESS } from "@/lib/utils";

export const revalidate = 10800;

interface PageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return NAHARIYA_BUYING_PAGES.map((page) => ({ category: page.categorySlug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const content = getNahariyaBuyingPage(decodeURIComponent(category));
  if (!content) return {};

  return buildMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: `/electric-appliances-nahariya/${content.categorySlug}`,
    images: [categoryImageFor(content.categorySlug)],
  });
}

function buildBrandCounts(
  products: Awaited<ReturnType<typeof getProductsByCategory>>
): { name: string; slug: string; count: number }[] {
  const counts = new Map<string, { name: string; slug: string; count: number }>();
  for (const product of products) {
    if (!product.brand || !product.brandSlug) continue;
    const current = counts.get(product.brandSlug);
    if (current) current.count += 1;
    else counts.set(product.brandSlug, { name: product.brand, slug: product.brandSlug, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "he"));
}

export default async function NahariyaCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const content = getNahariyaBuyingPage(decodeURIComponent(category));
  if (!content) notFound();

  const products = await getProductsByCategory(content.categorySlug);
  if (products.length === 0) notFound();

  const path = `/electric-appliances-nahariya/${content.categorySlug}`;
  const inStockCount = products.filter((product) => product.availability === "in_stock").length;
  const brands = buildBrandCounts(products);
  const orderedProducts = prioritizeProductsWithImages(products).sort(
    (a, b) => Number(b.availability === "in_stock") - Number(a.availability === "in_stock")
  );
  const featuredProducts = orderedProducts.slice(0, 8);
  const relatedRecommendations = RECOMMENDATION_PAGES.filter((page) =>
    content.relatedRecommendationSlugs.includes(page.slug)
  );
  const siblingPages = NAHARIYA_BUYING_PAGES.filter(
    (page) => page.categorySlug !== content.categorySlug
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "מוצרי חשמל בנהריה", path: "/electric-appliances-nahariya" },
          { name: content.categoryName, path },
        ]}
      />

      <div className="container-page pb-12 md:pb-16">
        <section
          className="page-intro-shell grid items-stretch gap-0 overflow-hidden p-0 md:grid-cols-[1.08fr_.92fr]"
          aria-labelledby="nahariya-category-title"
        >
          <div className="flex flex-col justify-center px-6 py-8 md:px-12 md:py-12">
            <p className="section-kicker">{content.eyebrow}</p>
            <h1
              id="nahariya-category-title"
              className="heading-balance mt-3 text-3xl font-black leading-[1.05] tracking-[-0.04em] text-graphite md:text-5xl"
            >
              {content.h1}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-graphite-soft/85 md:text-lg md:leading-8">
              {content.lead}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-blue px-3.5 py-2 font-bold text-white">
                {products.length} דגמים בקטלוג
              </span>
              <span className="rounded-full border border-line bg-white px-3.5 py-2 font-semibold text-graphite">
                {inStockCount} מסומנים במלאי
              </span>
              <span className="rounded-full border border-line bg-white px-3.5 py-2 font-semibold text-graphite">
                {brands.length} מותגים
              </span>
            </div>
          </div>
          <div className="relative min-h-64 overflow-hidden md:min-h-[28rem]">
            <Image
              src={categoryImageFor(content.categorySlug)}
              alt={`${content.categoryName} לבית בנהריה`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite/20 via-transparent to-transparent" />
          </div>
        </section>

        <section
          className="mt-6 rounded-[1.6rem] border border-brand-blue/15 bg-brand-blue-light p-5 md:mt-8 md:p-7"
          aria-labelledby="short-answer-heading"
        >
          <p className="section-kicker">תשובה קצרה ומעשית</p>
          <h2 id="short-answer-heading" className="mt-2 text-xl font-black text-graphite md:text-2xl">
            איפה בודקים {content.categoryName} בנהריה?
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-graphite-soft/85 md:text-base">
            בחדד יובל אלקטריק, {BUSINESS.addressStreet} ב{BUSINESS.addressCity}, אפשר לעיין כרגע ב־
            {products.length} דגמי {content.categoryName} בקטלוג, מהם {inStockCount} מסומנים במלאי. הסימון הוא
            בדיקה ראשונית; לפני נסיעה או הזמנה מאמתים את הדגם, האחריות והאספקה בטלפון {BUSINESS.phoneDisplay} או
            בוואטסאפ.
          </p>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link
              href={`/categories/${content.categorySlug}`}
              className="tap-target inline-flex items-center justify-center rounded-full bg-graphite px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-blue"
            >
              לכל דגמי {content.categoryName}
            </Link>
            <WhatsAppButton
              message={`שלום, אני מחפש/ת ${content.categoryName} בנהריה ואשמח לעזרה בבחירת דגם ובדיקת מלאי.`}
              label={`ייעוץ על ${content.categoryName} בוואטסאפ`}
              mobileLabel="ייעוץ בוואטסאפ"
              trackAs="whatsapp_click_header"
            />
            <PhoneButton phone={BUSINESS.phoneDisplay} label="שיחה עם החנות" />
          </div>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="decision-heading">
          <p className="section-kicker">לפני שסוגרים דגם</p>
          <h2 id="decision-heading" className="mt-2 text-2xl font-black text-graphite md:text-3xl">
            מה חשוב לבדוק ב{content.categoryName}?
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.decisionPoints.map((point, index) => (
              <article key={point.title} className="surface-card rounded-[1.4rem] p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue-light text-sm font-black text-brand-blue">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-black text-graphite">{point.title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite-soft/78">{point.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:mt-14 lg:grid-cols-[1fr_.78fr]" aria-labelledby="local-advice-heading">
          <div>
            <p className="section-kicker">הקשר מקומי</p>
            <h2 id="local-advice-heading" className="mt-2 text-2xl font-black text-graphite md:text-3xl">
              קניית {content.categoryName} לבית בנהריה
            </h2>
            <div className="mt-4 space-y-3 text-[15px] leading-7 text-graphite-soft/82 md:text-base md:leading-8">
              {content.localContext.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <aside className="rounded-[1.6rem] border border-line bg-surface p-5 md:p-6" aria-label="פרטי החנות">
            <h3 className="text-lg font-black text-graphite">מידע שניתן לאמת</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-bold text-graphite">שם העסק</dt>
                <dd className="mt-0.5 text-graphite-soft/75">{BUSINESS.nameHe}</dd>
              </div>
              <div>
                <dt className="font-bold text-graphite">כתובת</dt>
                <dd className="mt-0.5 text-graphite-soft/75">
                  {BUSINESS.addressStreet}, {BUSINESS.addressCity}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-graphite">טלפון ווואטסאפ</dt>
                <dd className="mt-0.5 text-graphite-soft/75">{BUSINESS.phoneDisplay}</dd>
              </div>
              <div>
                <dt className="font-bold text-graphite">בדיקת מלאי</dt>
                <dd className="mt-0.5 text-graphite-soft/75">סימון באתר ואימות סופי מול צוות החנות</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-graphite-soft/60">
              התוכן ונתוני הקטלוג נבדקו לאחרונה ב־
              <time dateTime="2026-07-23">23 ביולי 2026</time>. מלאי ותנאים עשויים להשתנות.
            </p>
          </aside>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="models-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">מהקטלוג הפעיל</p>
              <h2 id="models-heading" className="mt-2 text-2xl font-black text-graphite md:text-3xl">
                דגמי {content.categoryName} שכדאי לבדוק
              </h2>
            </div>
            <Link
              href={`/categories/${content.categorySlug}`}
              className="text-sm font-bold text-brand-blue hover:underline"
            >
              לצפייה בכל {products.length} הדגמים ←
            </Link>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite-soft/70">
            המוצרים מוצגים מתוך הקטלוג הנוכחי, עם עדיפות לדגמים בעלי תמונה ולדגמים המסומנים במלאי. אין כאן דירוג
            מלאכותי של “מקום ראשון” — ההתאמה תלויה בבית, בשימוש ובתקציב.
          </p>
          <div className="mt-5">
            <ProductGrid products={featuredProducts} />
          </div>
        </section>

        {brands.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="brands-heading">
            <h2 id="brands-heading" className="text-xl font-black text-graphite md:text-2xl">
              מותגי {content.categoryName} בקטלוג
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}/${content.categorySlug}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/35 hover:text-brand-blue"
                >
                  {brand.name} · {brand.count}
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedRecommendations.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="focused-searches-heading">
            <h2 id="focused-searches-heading" className="text-xl font-black text-graphite md:text-2xl">
              חיפושים ממוקדים בתוך הקטגוריה
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedRecommendations.map((recommendation) => (
                <Link
                  key={recommendation.slug}
                  href={`/recommended/${recommendation.slug}`}
                  className="group rounded-[1.35rem] border border-line bg-white p-5 transition-colors hover:border-brand-blue/35"
                >
                  <span className="text-xs font-black text-brand-gold">מדריך + דגמים תואמים</span>
                  <h3 className="mt-2 font-black text-graphite group-hover:text-brand-blue">
                    {recommendation.shortTitle}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-graphite-soft/72">{recommendation.lead}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 md:mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-black text-graphite md:text-3xl">
            שאלות נפוצות על {content.categoryName} בנהריה
          </h2>
          <div className="mt-4 max-w-4xl">
            <FaqAccordion items={content.faq} />
          </div>
        </section>

        <section className="mt-10 rounded-[1.6rem] border border-line bg-white p-5 md:mt-14 md:p-7" aria-labelledby="other-local-categories-heading">
          <h2 id="other-local-categories-heading" className="text-xl font-black text-graphite md:text-2xl">
            קטגוריות נוספות לקנייה בנהריה
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {siblingPages.map((page) => (
              <Link
                key={page.categorySlug}
                href={`/electric-appliances-nahariya/${page.categorySlug}`}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-graphite hover:border-brand-blue/35 hover:text-brand-blue"
              >
                {page.categoryName} בנהריה
              </Link>
            ))}
            <Link
              href="/electric-appliances-nahariya"
              className="rounded-full bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-dark"
            >
              לכל מוצרי החשמל בנהריה
            </Link>
          </div>
          <div className="mt-5 border-t border-line pt-5">
            <BusinessProfiles title="אימות פרטי העסק גם ב־" />
          </div>
        </section>
      </div>

      <JsonLd
        data={[
          collectionPageJsonLd({
            name: content.h1,
            description: content.seoDescription,
            path,
            image: categoryImageFor(content.categorySlug),
            dateModified: "2026-07-23",
            items: featuredProducts.map((product) => ({
              name: product.name,
              path: `/products/${product.slug}`,
              image: product.imageUrl?.startsWith("http") ? product.imageUrl : null,
            })),
          }),
          faqJsonLd(content.faq),
          localBusinessAreaJsonLd({
            city: "נהריה",
            path,
            areasServed: ["נהריה", "שבי ציון", "רגבה", "בן עמי", "בוסתן הגליל"],
            description: content.seoDescription,
          }),
        ]}
      />
    </>
  );
}
