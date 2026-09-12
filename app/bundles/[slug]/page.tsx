import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUNDLES, getBundleBySlug } from "@/content/bundles";
import { guideSlugsForBundle } from "@/content/guideBundleLinks";
import { getGuideBySlug } from "@/content/guides";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BundleAddAllButton } from "@/components/bundles/BundleAddAllButton";
import { ContactStrip } from "@/components/ContactStrip";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { ViewTracker } from "@/components/ViewTracker";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getProducts } from "@/lib/base44/catalog";
import { selectBundleProducts } from "@/lib/bundles";
import { buildMetadata } from "@/lib/seo/metadata";
import { collectionPageJsonLd, faqJsonLd } from "@/lib/schema/jsonld";
import { buildWhatsAppBasketMessage } from "@/lib/whatsapp/messages";
import type { RequestBasketItem } from "@/types/product";

export const revalidate = 10800;
export const dynamicParams = false;

interface BundlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BUNDLES.map((bundle) => ({ slug: bundle.slug }));
}

export async function generateMetadata({ params }: BundlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = getBundleBySlug(slug);
  if (!bundle) return {};

  return buildMetadata({
    title: bundle.seoTitle,
    description: bundle.seoDescription,
    path: `/bundles/${bundle.slug}`,
    images: [bundle.image],
  });
}

export default async function BundlePage({ params }: BundlePageProps) {
  const { slug } = await params;
  const bundle = getBundleBySlug(slug);
  if (!bundle) notFound();

  // Guides that explain what this package assumes. They currently outrank the
  // bundle pages on the same topics — the young-couple guide holds position
  // 18.56 against 33.14 for its bundle — so the two are linked in both
  // directions rather than left as strangers.
  const pairedGuides = guideSlugsForBundle(bundle.slug)
    .map((slug) => getGuideBySlug(slug))
    .filter((guide): guide is NonNullable<typeof guide> => guide !== null);

  const products = await getProducts();
  const selected = selectBundleProducts(bundle, products);
  const basketProducts: RequestBasketItem[] = selected.map(({ product }) => ({
    modelNumber: product.modelNumber,
    name: product.name,
    slug: product.slug,
    imageUrl: product.imageUrl,
    brand: product.brand,
  }));
  const inStockCount = selected.filter(({ product }) => product.availability === "in_stock").length;
  const currentIndex = BUNDLES.findIndex((item) => item.slug === bundle.slug);
  const relatedBundles = [1, 4, 7]
    .map((offset) => BUNDLES[(currentIndex + offset) % BUNDLES.length])
    .filter((item, index, array) => array.findIndex((candidate) => candidate.slug === item.slug) === index);
  const whatsappMessage = buildWhatsAppBasketMessage(basketProducts, {
    notes: `הגעתי מעמוד החבילה: ${bundle.title}`,
  });

  return (
    <>
      <ViewTracker event="bundle_view" slug={bundle.slug} />
      <Breadcrumbs
        items={[
          { name: "חבילות מומלצות", path: "/bundles" },
          { name: bundle.shortTitle, path: `/bundles/${bundle.slug}` },
        ]}
      />

      <div className="pb-24 md:pb-20">
        <section className="container-page">
          <div className="overflow-hidden rounded-[2rem] border border-line/70 bg-white shadow-[0_32px_85px_-58px_rgba(10,22,36,0.6)] md:grid md:grid-cols-[1.02fr_0.98fr] md:rounded-[2.75rem]">
            <div className="flex flex-col justify-center p-6 sm:p-9 md:p-11 lg:p-14">
              <p className="text-xs font-black tracking-[0.13em] text-brand-gold">{bundle.eyebrow}</p>
              <h1 className="heading-balance mt-4 text-4xl font-black leading-[1.04] tracking-[-0.045em] text-graphite md:text-5xl lg:text-6xl">
                {bundle.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-graphite-soft/76 md:text-lg md:leading-8">{bundle.description}</p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-brand-blue-light px-3.5 py-2 text-brand-blue">{selected.length} מוצרים מומלצים</span>
                <span className="rounded-full bg-success-bg px-3.5 py-2 text-success">{inStockCount} מסומנים במלאי כרגע</span>
                <span className="rounded-full bg-surface px-3.5 py-2 text-graphite-soft/72">עדכון קטלוג כל 3 שעות</span>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <BundleAddAllButton
                  products={basketProducts}
                  bundleSlug={bundle.slug}
                  bundleName={bundle.title}
                  stickyMobile
                  className="w-full sm:w-auto"
                />
                <WhatsAppButton
                  message={whatsappMessage}
                  label="התייעצות על החבילה"
                  trackAs="whatsapp_click_basket"
                  trackSlug={bundle.slug}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-graphite-soft/58">
                ההוספה היא לסל בקשה, ללא חיוב. מחיר, מלאי והתאמה סופית נבדקים מול צוות החנות.
              </p>
            </div>

            <div className="relative min-h-[22rem] overflow-hidden bg-[#eef1f2] md:min-h-[38rem]">
              <Image
                src={bundle.image}
                alt={bundle.imageAlt}
                fill
                priority
                loading="eager"
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071a2c]/88 via-[#071a2c]/28 to-transparent px-5 pb-5 pt-20 text-white">
                <p className="text-xs leading-5 text-white/76">
                  תמונת החבילה מציגה את סוגי המוצרים המומלצים. הדגמים המדויקים מהקטלוג מופיעים בהמשך העמוד.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-20" aria-labelledby="selection-heading">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
            <div>
              <p className="section-kicker">למה החבילה בנויה כך</p>
              <h2 id="selection-heading" className="section-title mt-3">היגיון לפני רשימת קניות</h2>
              <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
                ההמלצה אינה מחליפה מדידה וייעוץ. היא מסדרת את סדר העדיפויות, כדי שהשיחה עם החנות תתחיל מצרכים אמיתיים ולא מעשרות דגמים.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {bundle.approach.map((item, index) => (
                <article key={item} className="surface-card rounded-[1.5rem] p-5">
                  <span className="text-xs font-black tracking-[0.12em] text-brand-gold">0{index + 1}</span>
                  <p className="mt-7 text-sm font-semibold leading-6 text-graphite">{item}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-[1.5rem] border border-brand-blue/15 bg-brand-blue-light/62 p-5 md:p-6">
            <p className="text-sm font-black text-brand-blue">החבילה מתאימה במיוחד ל־</p>
            <ul className="mt-3 grid gap-2 text-sm text-graphite-soft/78 sm:grid-cols-3">
              {bundle.audience.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-line/70 bg-surface py-14 md:py-20" aria-labelledby="products-heading">
          <div className="container-page">
            <div className="max-w-3xl">
              <p className="section-kicker">הדגמים שנבחרו עכשיו מהקטלוג</p>
              <h2 id="products-heading" className="section-title mt-3">המוצרים בחבילת חדד</h2>
              <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
                כל כרטיס הוא מוצר אמיתי מהקטלוג. הבחירה נותנת עדיפות לזמינות, לתמונה ולמידע מלא; לפני הזמנה הצוות מאמת מלאי, מידות ותשתיות.
              </p>
            </div>

            {selected.length > 0 ? (
              <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {selected.map(({ slot, product }, index) => (
                  <div key={product.modelNumber} className="flex h-full flex-col">
                    <div className="mb-2.5 flex items-center gap-2 px-1">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#071a2c] text-[11px] font-black text-white">{index + 1}</span>
                      <p className="text-sm font-black text-graphite">{slot.label}</p>
                    </div>
                    <div className="flex-1"><ProductCard product={product} /></div>
                    <div className="mx-2 rounded-b-[1.25rem] border border-t-0 border-brand-gold/24 bg-[#fffaf0] px-4 py-3 text-xs leading-5 text-graphite-soft/78">
                      <strong className="text-graphite">למה בחבילה: </strong>{slot.rationale}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[1.5rem] border border-dashed border-line bg-white p-10 text-center text-graphite-soft/70">
                הקטלוג מתעדכן כרגע. אפשר לשלוח וואטסאפ ולקבל התאמה ידנית מהצוות.
              </div>
            )}

            <div className="mt-10 flex flex-col items-center rounded-[1.75rem] bg-white p-6 text-center shadow-[0_24px_65px_-48px_rgba(10,22,36,0.6)] md:p-8">
              <h3 className="text-xl font-black text-graphite md:text-2xl">רוצים את כל ההמלצה בבקשה אחת?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-soft/70">הוסיפו הכול, עברו לסל, הסירו מה שלא צריך ושלחו לצוות לבדיקת זמינות והצעה.</p>
              <BundleAddAllButton products={basketProducts} bundleSlug={bundle.slug} bundleName={bundle.title} className="mt-5" />
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-20" aria-labelledby="checklist-heading">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="section-kicker">לפני שמזמינים</p>
              <h2 id="checklist-heading" className="section-title mt-3">בדיקות שחוסכות טעות יקרה</h2>
              <div className="mt-7 space-y-3">
                {bundle.checklist.map((item, index) => (
                  <article key={item.title} className="flex gap-4 rounded-[1.4rem] border border-line/80 bg-white p-5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue-light text-xs font-black text-brand-blue">{index + 1}</span>
                    <div>
                      <h3 className="font-black text-graphite">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-graphite-soft/72">{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] bg-[#071a2c] p-7 text-white md:p-10">
              <p className="text-xs font-black tracking-[0.13em] text-brand-gold">טיפ מקצועי</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] md:text-3xl">מה חשוב לזכור בחבילה הזאת</h2>
              <ul className="mt-7 space-y-4">
                {bundle.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm leading-7 text-white/75 md:text-base">
                    <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                    {tip}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-xs leading-6 text-white/58">
                האתר אינו מציג מחירים ואינו מבצע סליקה. נתוני הזמינות כלליים וכפופים לאישור החנות והיבואן.
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line/70 bg-white py-14 md:py-20" aria-labelledby="faq-heading">
          <div className="container-page mx-auto max-w-5xl">
            <p className="section-kicker">שאלות לפני החלטה</p>
            <h2 id="faq-heading" className="section-title mt-3">שאלות נפוצות על {bundle.shortTitle}</h2>
            <div className="mt-7"><FaqAccordion items={bundle.faq} /></div>
          </div>
        </section>

        <section className="container-page py-14 md:py-20" aria-labelledby="related-bundles-heading">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">אפשרות נוספת להשוואה</p>
              <h2 id="related-bundles-heading" className="section-title mt-3">חבילות נוספות שכדאי לבדוק</h2>
            </div>
            <Link href="/bundles" className="hidden text-sm font-black text-brand-blue hover:underline md:block">לכל החבילות ←</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedBundles.map((item) => (
              <Link key={item.slug} href={`/bundles/${item.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-line bg-white transition hover:-translate-y-1 hover:border-brand-gold/40">
                <div className="relative aspect-[16/9] overflow-hidden bg-surface">
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h3 className="font-black text-graphite group-hover:text-brand-blue">{item.shortTitle}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-graphite-soft/68">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {pairedGuides.length > 0 && (
          <section className="container-page mt-10 md:mt-14" aria-labelledby="bundle-guides-heading">
            <h2 id="bundle-guides-heading" className="text-lg font-bold text-graphite md:text-2xl">
              לקרוא לפני שמחליטים
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {pairedGuides.map((guide) => (
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
          </section>
        )}

        <div className="container-page"><ContactStrip /></div>
      </div>

      <JsonLd
        data={[
          collectionPageJsonLd({
            name: bundle.title,
            description: bundle.seoDescription,
            path: `/bundles/${bundle.slug}`,
            image: bundle.image,
            items: selected.map(({ product }) => ({
              name: product.name,
              path: `/products/${encodeURIComponent(product.slug)}`,
              image: product.imageUrl,
            })),
          }),
          faqJsonLd(bundle.faq),
        ]}
      />
    </>
  );
}
