import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactStrip } from "@/components/ContactStrip";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { ProductGrid } from "@/components/ProductGrid";
import { ViewTracker } from "@/components/ViewTracker";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getRecommendationPage, RECOMMENDATION_PAGES } from "@/content/recommendationPages";
import { categoryImageFor } from "@/lib/categoryVisuals";
import { getRecommendationProducts } from "@/lib/seo/recommendationProducts";
import { buildMetadata } from "@/lib/seo/metadata";
import { collectionPageJsonLd, faqJsonLd } from "@/lib/schema/jsonld";

export const revalidate = 10800;
export const dynamicParams = false;

interface RecommendedPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return RECOMMENDATION_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: RecommendedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getRecommendationPage(slug);
  if (!page) return {};

  return buildMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/recommended/${page.slug}`,
    images: [categoryImageFor(page.categorySlug)],
  });
}

export default async function RecommendedPage({ params }: RecommendedPageProps) {
  const { slug } = await params;
  const page = getRecommendationPage(slug);
  if (!page) notFound();

  const products = await getRecommendationProducts(page);
  if (products.length < 4) notFound();

  const inStockCount = products.filter((product) => product.availability === "in_stock").length;
  const brands = Array.from(
    new Map(
      products
        .filter((product) => product.brand && product.brandSlug)
        .map((product) => [product.brandSlug as string, product.brand as string])
    ).entries()
  );
  const relatedPages = page.relatedSlugs
    .map((relatedSlug) => getRecommendationPage(relatedSlug))
    .filter((relatedPage) => relatedPage !== null);
  const whatsappMessage = [
    `שלום, הגעתי לעמוד “${page.shortTitle}” באתר חדד יובל אלקטריק.`,
    "אשמח לעזרה בהשוואת הדגמים, בדיקת התאמה, זמינות והצעת מחיר.",
  ].join("\n");

  return (
    <>
      <ViewTracker event="category_view" category={`recommended/${page.slug}`} />
      <Breadcrumbs
        items={[
          { name: "מומלצים והשוואות", path: "/recommended" },
          { name: page.shortTitle, path: `/recommended/${page.slug}` },
        ]}
      />

      <div className="pb-14 md:pb-20">
        <section className="container-page" aria-labelledby="recommendation-title">
          <div className="overflow-hidden rounded-[2rem] border border-line/70 bg-white shadow-[0_30px_80px_-55px_rgba(10,22,36,.65)] md:grid md:grid-cols-[1.06fr_.94fr] md:rounded-[2.75rem]">
            <div className="flex flex-col justify-center p-6 sm:p-9 md:p-11 lg:p-14">
              <p className="section-kicker">{page.eyebrow}</p>
              <h1 id="recommendation-title" className="heading-balance mt-4 text-4xl font-black leading-[1.04] tracking-[-0.045em] text-graphite md:text-5xl lg:text-6xl">
                {page.h1}
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-graphite-soft/76 md:text-base">{page.lead}</p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-brand-blue px-3.5 py-2 text-white">{products.length} דגמים תואמים</span>
                <span className="rounded-full bg-success-bg px-3.5 py-2 text-success">{inStockCount} מסומנים במלאי</span>
                <span className="rounded-full bg-surface px-3.5 py-2 text-graphite-soft/72">סינון מהקטלוג הפעיל</span>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="#models" className="tap-scale inline-flex min-h-12 items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-black text-white transition hover:bg-brand-blue">
                  לצפייה בדגמים
                </Link>
                <WhatsAppButton
                  message={whatsappMessage}
                  label="עזרה בבחירה"
                  trackAs="whatsapp_click_basket"
                  trackSlug={`recommended/${page.slug}`}
                  size="lg"
                  variant="outline"
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-graphite-soft/58">
                “מומלץ” פירושו מתאים לצורך ולמידות שלכם. לא בוצעה בדיקת מעבדה או קביעה של דירוג אוניברסלי.
              </p>
            </div>

            <div className="relative min-h-[22rem] overflow-hidden bg-surface md:min-h-[42rem]">
              <Image
                src={categoryImageFor(page.categorySlug)}
                alt={page.shortTitle}
                fill
                priority
                loading="eager"
                sizes="(max-width: 768px) 100vw, 47vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071a2c]/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs font-black tracking-[.08em] text-brand-gold">מותגים שמופיעים בהשוואה</p>
                <p className="mt-2 text-sm leading-6 text-white/78">{brands.slice(0, 8).map(([, brand]) => brand).join(" · ")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-12 md:py-16" aria-labelledby="recommendation-intro-heading">
          <div className="grid gap-9 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
            <div>
              <p className="section-kicker">לפני שבוחרים דגם</p>
              <h2 id="recommendation-intro-heading" className="section-title mt-3">מה חשוב לדעת על {page.shortTitle}</h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-graphite-soft/78 md:text-base md:leading-8">
              {page.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {page.selectionPoints.map((point, index) => (
              <article key={point.title} className="rounded-[1.5rem] border border-line bg-white p-5 shadow-[0_18px_45px_-40px_rgba(10,22,36,.55)] md:p-6">
                <span className="text-xs font-black tracking-[.12em] text-brand-gold">0{index + 1}</span>
                <h3 className="mt-7 font-black text-graphite">{point.title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite-soft/72">{point.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-line/70 bg-brand-blue-light/45 py-9 md:py-11" aria-labelledby="search-phrases-heading">
          <div className="container-page md:flex md:items-center md:justify-between md:gap-10">
            <div className="max-w-2xl">
              <p className="text-xs font-black tracking-[.1em] text-brand-blue">ניסוחים נפוצים לאותה החלטה</p>
              <h2 id="search-phrases-heading" className="mt-2 text-xl font-black text-graphite md:text-2xl">העמוד עונה גם על החיפושים האלה</h2>
              <p className="mt-2 text-sm leading-6 text-graphite-soft/70">בכל ניסוח, רשימת המוצרים נשארת מסוננת לפי אותה תכונה מדויקת.</p>
            </div>
            <div className="mt-4 flex max-w-xl flex-wrap gap-2 md:mt-0 md:justify-end">
              {page.searchPhrases.map((phrase) => (
                <span key={phrase} className="rounded-full border border-brand-blue/14 bg-white px-3.5 py-2 text-xs font-bold text-graphite-soft/78">{phrase}</span>
              ))}
            </div>
          </div>
        </section>

        <section id="models" className="scroll-mt-28 bg-surface py-14 md:py-20" aria-labelledby="models-heading">
          <div className="container-page">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="section-kicker">סינון מהקטלוג הפעיל</p>
                <h2 id="models-heading" className="section-title mt-3">כל דגמי {page.shortTitle} להשוואה</h2>
                <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
                  המוצרים מסודרים כך שדגמים שמסומנים במלאי ובעלי מידע מלא יופיעו קודם. כל כרטיס מוביל למפרט הדגם; מלאי והצעה סופית כפופים לאישור החנות.
                </p>
              </div>
              <Link href={`/categories/${page.categorySlug}`} className="text-sm font-black text-brand-blue hover:underline">לכל קטגוריית {page.categoryName} ←</Link>
            </div>
            <div className="mt-8"><ProductGrid products={products} emptyMessage="לא נמצאו דגמים תואמים כרגע." /></div>
          </div>
        </section>

        <section className="container-page py-14 md:py-20" aria-labelledby="questions-heading">
          <div className="grid gap-8 rounded-[2rem] bg-[#071a2c] p-6 text-white md:grid-cols-[.85fr_1.15fr] md:p-10 lg:p-12">
            <div>
              <p className="section-kicker !text-brand-gold before:!bg-brand-gold">הכנה לשיחה קצרה</p>
              <h2 id="questions-heading" className="mt-3 text-2xl font-black leading-tight md:text-4xl">ארבע שאלות שיחסכו בחירה לא מתאימה</h2>
              <p className="mt-4 text-sm leading-7 text-white/68">שלחו לצוות את התשובות ואת הדגמים שמעניינים אתכם, ונוכל למקד את ההשוואה מהר יותר.</p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {page.questionsToAsk.map((question, index) => (
                <li key={question} className="rounded-[1.25rem] border border-white/12 bg-white/7 p-4 text-sm font-bold leading-6">
                  <span className="mb-3 block text-xs font-black text-brand-gold">0{index + 1}</span>
                  {question}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-line/70 bg-white py-14 md:py-20" aria-labelledby="recommendation-faq-heading">
          <div className="container-page mx-auto max-w-5xl">
            <p className="section-kicker">שאלות נפוצות לפני קנייה</p>
            <h2 id="recommendation-faq-heading" className="section-title mt-3">שאלות על {page.shortTitle}</h2>
            <div className="mt-7"><FaqAccordion items={page.faq} /></div>
          </div>
        </section>

        {(brands.length > 0 || relatedPages.length > 0) && (
          <section className="container-page py-14 md:py-20" aria-labelledby="related-heading">
            <p className="section-kicker">המשיכו לבדוק ולהשוות</p>
            <h2 id="related-heading" className="section-title mt-3">עמודים קשורים</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {brands.length > 0 && (
                <div className="rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
                  <h3 className="font-black text-graphite">מותגים שמופיעים בעמוד</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {brands.slice(0, 10).map(([brandSlug, brand]) => (
                      <Link key={brandSlug} href={`/brands/${brandSlug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-graphite hover:border-brand-blue/35 hover:text-brand-blue">{brand}</Link>
                    ))}
                  </div>
                </div>
              )}
              {relatedPages.length > 0 && (
                <div className="rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
                  <h3 className="font-black text-graphite">השוואות נוספות לבית</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {relatedPages.map((relatedPage) => (
                      <Link key={relatedPage.slug} href={`/recommended/${relatedPage.slug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-graphite hover:border-brand-blue/35 hover:text-brand-blue">{relatedPage.shortTitle}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="container-page"><ContactStrip /></div>
      </div>

      <JsonLd
        data={[
          collectionPageJsonLd({
            name: page.h1,
            description: page.seoDescription,
            path: `/recommended/${page.slug}`,
            image: categoryImageFor(page.categorySlug),
            items: products.map((product) => ({
              name: product.name,
              path: `/products/${encodeURIComponent(product.slug)}`,
              image: product.imageUrl,
            })),
          }),
          faqJsonLd(page.faq),
        ]}
      />
    </>
  );
}
