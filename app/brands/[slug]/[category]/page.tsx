import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactStrip } from "@/components/ContactStrip";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { ProductGrid } from "@/components/ProductGrid";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { ViewTracker } from "@/components/ViewTracker";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCuratedBrandCategoryContent } from "@/content/brandCategoryContent";
import {
  buildBrandCategoryPresentation,
  getBrandCategoryBuyingGuide,
} from "@/content/brandCategorySeo";
import { getProductsByBrandAndCategory } from "@/lib/base44/catalog";
import { categoryImageFor } from "@/lib/categoryVisuals";
import { getSeoBrandCategoryCombos } from "@/lib/seo/brandCategoryCombos";
import { generateBrandCategoryMetadata } from "@/lib/seo/metadata";
import { collectionPageJsonLd, faqJsonLd } from "@/lib/schema/jsonld";

export const revalidate = 10800;
export const dynamicParams = false;

interface BrandCategoryPageProps {
  params: Promise<{ slug: string; category: string }>;
}

export async function generateStaticParams() {
  const combos = await getSeoBrandCategoryCombos();
  return combos.map((combo) => ({ slug: combo.brandSlug, category: combo.categorySlug }));
}

export async function generateMetadata({ params }: BrandCategoryPageProps): Promise<Metadata> {
  const { slug, category } = await params;
  const combos = await getSeoBrandCategoryCombos();
  const combo = combos.find((item) => item.brandSlug === slug && item.categorySlug === category);
  if (!combo) return {};

  const presentation = buildBrandCategoryPresentation(combo);
  return generateBrandCategoryMetadata(combo, {
    title: presentation.seoTitle,
    description: presentation.seoDescription,
  });
}

export default async function BrandCategoryPage({ params }: BrandCategoryPageProps) {
  const { slug, category } = await params;
  const combos = await getSeoBrandCategoryCombos();
  const combo = combos.find((item) => item.brandSlug === slug && item.categorySlug === category);
  if (!combo) notFound();

  const products = await getProductsByBrandAndCategory(slug, category);
  const content = getCuratedBrandCategoryContent(slug, category);
  if (!content || products.length < 4) notFound();

  const presentation = buildBrandCategoryPresentation(combo);
  const buyingGuide = getBrandCategoryBuyingGuide(category);
  const inStockCount = products.filter((product) => product.availability === "in_stock").length;
  const modelNumbers = products
    .map((product) => product.modelNumber.trim())
    .filter(Boolean)
    .slice(0, 6);
  const relatedBrandCombos = combos
    .filter((item) => item.categorySlug === category && item.brandSlug !== slug)
    .slice(0, 6);
  const otherBrandCombos = combos
    .filter((item) => item.brandSlug === slug && item.categorySlug !== category)
    .slice(0, 6);
  const whatsappMessage = [
    `שלום, הגעתי לעמוד ${presentation.headline} באתר חדד יובל אלקטריק.`,
    "אשמח לעזרה בהשוואת הדגמים, בדיקת זמינות וקבלת הצעת מחיר.",
  ].join("\n");

  return (
    <>
      <ViewTracker event="brand_view" slug={`${slug}/${category}`} />
      <Breadcrumbs
        items={[
          { name: "מותגים", path: "/brands" },
          { name: combo.brand, path: `/brands/${slug}` },
          { name: presentation.headline, path: `/brands/${slug}/${category}` },
        ]}
      />

      <div className="pb-14 md:pb-20">
        <section className="container-page" aria-labelledby="brand-category-title">
          <div className="overflow-hidden rounded-[2rem] border border-line/70 bg-white shadow-[0_30px_80px_-55px_rgba(10,22,36,.65)] md:grid md:grid-cols-[1.04fr_.96fr] md:rounded-[2.75rem]">
            <div className="flex flex-col justify-center p-6 sm:p-9 md:p-11 lg:p-14">
              <p className="section-kicker">מותג × מוצר · קטלוג שמתעדכן מהאתר</p>
              <h1
                id="brand-category-title"
                className="heading-balance mt-4 text-4xl font-black leading-[1.04] tracking-[-0.045em] text-graphite md:text-5xl lg:text-6xl"
              >
                {presentation.headline}
                <span className="mt-2 block text-[.62em] leading-tight text-brand-blue">כל הדגמים במקום אחד</span>
              </h1>
              <div className="mt-5 max-w-3xl">
                <SeoTextBlock>
                  {content.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </SeoTextBlock>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-brand-blue px-3.5 py-2 text-white">{products.length} דגמים בקטלוג</span>
                <span className="rounded-full bg-success-bg px-3.5 py-2 text-success">{inStockCount} מסומנים במלאי</span>
                <span className="rounded-full bg-surface px-3.5 py-2 text-graphite-soft/72">עדכון כל 3 שעות</span>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#models"
                  className="tap-scale inline-flex min-h-12 items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-black text-white transition hover:bg-brand-blue"
                >
                  לצפייה בכל הדגמים
                </Link>
                <WhatsAppButton
                  message={whatsappMessage}
                  label="השוואה והצעת מחיר"
                  trackAs="whatsapp_click_basket"
                  trackSlug={`${slug}/${category}`}
                  size="lg"
                  variant="outline"
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-graphite-soft/58">
                האתר אינו מציג מחירים ואינו מבצע חיוב. הצוות מאמת זמינות, התאמה והצעה סופית לפני הזמנה.
              </p>
            </div>

            <div className="relative min-h-[22rem] overflow-hidden bg-surface md:min-h-[40rem]">
              <Image
                src={categoryImageFor(category)}
                alt={`${presentation.headline} בקטלוג חדד יובל אלקטריק`}
                fill
                priority
                loading="eager"
                sizes="(max-width: 768px) 100vw, 48vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071a2c]/92 via-[#071a2c]/28 to-transparent px-6 pb-6 pt-24 text-white">
                <p className="text-xs font-bold tracking-[.08em] text-brand-gold">דגמים שמופיעים כעת בעמוד</p>
                <p className="mt-2 text-sm leading-6 text-white/75">{modelNumbers.join(" · ")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-10 md:py-14" aria-labelledby="search-phrases-heading">
          <div className="rounded-[1.5rem] border border-brand-blue/12 bg-brand-blue-light/55 p-5 md:flex md:items-center md:justify-between md:gap-8 md:p-7">
            <div className="max-w-2xl">
              <p className="text-xs font-black tracking-[.11em] text-brand-blue">אותה כוונת חיפוש, כמה ניסוחים</p>
              <h2 id="search-phrases-heading" className="mt-2 text-xl font-black text-graphite md:text-2xl">
                העמוד מרכז את כל הדרך מהחיפוש להשוואה אמיתית
              </h2>
              <p className="mt-2 text-sm leading-6 text-graphite-soft/72">
                בין אם חיפשתם בלשון יחיד, רבים, בעברית או באנגלית — כאן תראו רק דגמים שקיימים בקטלוג הפעיל.
              </p>
            </div>
            <div className="mt-4 flex max-w-xl flex-wrap gap-2 md:mt-0 md:justify-end">
              {presentation.searchPhrases.map((phrase) => (
                <span key={phrase} className="rounded-full border border-brand-blue/14 bg-white px-3.5 py-2 text-xs font-bold text-graphite-soft/78">
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="models" className="scroll-mt-28 border-y border-line/70 bg-surface py-14 md:py-20" aria-labelledby="models-heading">
          <div className="container-page">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="section-kicker">כל הדגמים מהקטלוג הפעיל</p>
                <h2 id="models-heading" className="section-title mt-3">השוואת {presentation.headline}</h2>
                <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
                  כל כרטיס מוביל לעמוד הדגם המלא. סימון המלאי הוא אינדיקציה נוכחית וכפוף לאישור החנות והיבואן.
                </p>
              </div>
              <div className="text-sm font-bold text-graphite-soft/65">{products.length} דגמים · {inStockCount} במלאי</div>
            </div>
            <div className="mt-8">
              <ProductGrid products={products} emptyMessage="לא נמצאו דגמים זמינים בצירוף זה כרגע." />
            </div>
          </div>
        </section>

        {buyingGuide && (
          <section className="container-page py-14 md:py-20" aria-labelledby="buying-guide-heading">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
              <div>
                <p className="section-kicker">מדריך קנייה ממוקד</p>
                <h2 id="buying-guide-heading" className="section-title mt-3">
                  איך לבחור {buyingGuide.singular} {presentation.brandSearchName}?
                </h2>
                <p className="mt-4 text-sm leading-7 text-graphite-soft/75 md:text-base">{buyingGuide.intro}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {buyingGuide.points.map((point, index) => (
                  <article key={point.title} className="surface-card rounded-[1.5rem] p-5 md:p-6">
                    <span className="text-xs font-black tracking-[.12em] text-brand-gold">0{index + 1}</span>
                    <h3 className="mt-7 text-base font-black text-graphite">{point.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-graphite-soft/72">{point.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <article className="rounded-[1.5rem] bg-[#071a2c] p-6 text-white">
                <p className="text-xs font-black text-brand-gold">מחיר וזמינות</p>
                <h3 className="mt-3 text-lg font-black">מקבלים הצעה לדגם המדויק</h3>
                <p className="mt-2 text-sm leading-6 text-white/68">המחיר והמלאי מאומתים מול החנות, בלי להציג מחיר ישן או הבטחה שלא נבדקה.</p>
              </article>
              <article className="rounded-[1.5rem] border border-line bg-white p-6">
                <p className="text-xs font-black text-brand-blue">התאמה לפני הזמנה</p>
                <h3 className="mt-3 text-lg font-black text-graphite">מודדים ובודקים תשתית</h3>
                <p className="mt-2 text-sm leading-6 text-graphite-soft/72">מידות, חשמל, מים, ניקוז או התקנה נבדקים לפי סוג המוצר ולפי הבית שלכם.</p>
              </article>
              <article className="rounded-[1.5rem] border border-line bg-white p-6">
                <p className="text-xs font-black text-brand-blue">משלוח בצפון</p>
                <h3 className="mt-3 text-lg font-black text-graphite">תיאום אישי מהחנות</h3>
                <p className="mt-2 text-sm leading-6 text-graphite-soft/72">נהריה, עכו, הקריות, כרמיאל, הגליל והסביבה — לפי תנאי המשלוח וההתקנה של המוצר.</p>
              </article>
            </div>

            <div className="mt-8 flex flex-col items-center rounded-[1.75rem] border border-brand-gold/20 bg-[#fffaf0] p-6 text-center md:p-8">
              <h3 className="text-xl font-black text-graphite md:text-2xl">מתלבטים בין שני דגמים?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-soft/72">שלחו את שמות הדגמים, מידות החלל ומה חשוב לכם — ונמקד את ההשוואה.</p>
              <WhatsAppButton
                message={whatsappMessage}
                label={`ייעוץ על ${presentation.headline}`}
                trackAs="whatsapp_click_basket"
                trackSlug={`${slug}/${category}`}
                size="lg"
                className="mt-5"
              />
            </div>
          </section>
        )}

        <section className="border-y border-line/70 bg-white py-14 md:py-20" aria-labelledby="brand-category-faq-heading">
          <div className="container-page mx-auto max-w-5xl">
            <p className="section-kicker">שאלות לפני החלטה</p>
            <h2 id="brand-category-faq-heading" className="section-title mt-3">שאלות נפוצות על {presentation.headline}</h2>
            <div className="mt-7"><FaqAccordion items={content.faq} /></div>
          </div>
        </section>

        {(relatedBrandCombos.length > 0 || otherBrandCombos.length > 0) && (
          <section className="container-page py-14 md:py-20" aria-labelledby="related-combinations-heading">
            <p className="section-kicker">המשיכו להשוות</p>
            <h2 id="related-combinations-heading" className="section-title mt-3">עמודי מותג ומוצר קשורים</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {relatedBrandCombos.length > 0 && (
                <div className="rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
                  <h3 className="font-black text-graphite">{combo.category} ממותגים נוספים</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {relatedBrandCombos.map((item) => {
                      const itemPresentation = buildBrandCategoryPresentation(item);
                      return (
                        <Link key={`${item.brandSlug}:${item.categorySlug}`} href={`/brands/${item.brandSlug}/${item.categorySlug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-graphite hover:border-brand-blue/35 hover:text-brand-blue">
                          {itemPresentation.headline}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              {otherBrandCombos.length > 0 && (
                <div className="rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
                  <h3 className="font-black text-graphite">קטגוריות נוספות של {presentation.brandSearchName}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {otherBrandCombos.map((item) => {
                      const itemPresentation = buildBrandCategoryPresentation(item);
                      return (
                        <Link key={`${item.brandSlug}:${item.categorySlug}`} href={`/brands/${item.brandSlug}/${item.categorySlug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-graphite hover:border-brand-blue/35 hover:text-brand-blue">
                          {itemPresentation.headline}
                        </Link>
                      );
                    })}
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
            name: presentation.headline,
            description: presentation.seoDescription,
            path: `/brands/${slug}/${category}`,
            image: categoryImageFor(category),
            items: products.map((product) => ({
              name: product.name,
              path: `/products/${encodeURIComponent(product.slug)}`,
              image: product.imageUrl,
            })),
          }),
          faqJsonLd(content.faq),
        ]}
      />
    </>
  );
}
