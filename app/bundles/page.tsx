import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BUNDLES } from "@/content/bundles";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { collectionPageJsonLd, faqJsonLd } from "@/lib/schema/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "חבילות מוצרי חשמל מומלצות לבית",
  description:
    "15 חבילות מוצרי חשמל לפי שלב בחיים וסוג הבית — זוגות צעירים, מעבר דירה, אחרי חתונה, משפחות, דירה קטנה ועוד. מוצרים אמיתיים מהקטלוג והוספה מרוכזת לבקשה.",
  path: "/bundles",
  images: [BUNDLES[0].image],
});

const INDEX_FAQ = [
  {
    question: "איך המוצרים בכל חבילה נבחרים?",
    answer:
      "כל חבילה מגדירה את סוגי המוצרים והמאפיינים המתאימים לתרחיש. העמוד בוחר דגמים מתוך הקטלוג העדכני, עם עדיפות למוצרים במלאי, לתמונה זמינה ולמידע מוצר מלא.",
  },
  {
    question: "האם חייבים לקחת את כל המוצרים בחבילה?",
    answer:
      "לא. אפשר להוסיף את כל החבילה לסל הבקשה בלחיצה ואז להסיר, להחליף או להוסיף מוצרים. צוות החנות מאמת את ההתאמה לפני הזמנה.",
  },
  {
    question: "למה אין מחיר כולל לחבילה?",
    answer:
      "האתר הוא קטלוג ללא מחירים וללא סליקה. מלאי, דגמים ותנאים משתנים, ולכן לאחר שליחת הבקשה צוות חדד אלקטריק בודק זמינות ומכין הצעה עדכנית.",
  },
];

export default function BundlesPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "חבילות מומלצות", path: "/bundles" }]} />
      <div className="pb-16 md:pb-24">
        <section className="container-page">
          <div className="blueprint-grid relative overflow-hidden rounded-[2rem] bg-[#071a2c] px-6 py-10 text-white md:grid md:grid-cols-[1.08fr_0.92fr] md:items-center md:gap-12 md:rounded-[2.75rem] md:px-12 md:py-14 lg:px-16">
            <div className="relative z-10">
              <p className="text-xs font-extrabold tracking-[0.14em] text-brand-gold">ההמלצה של חדד אלקטריק</p>
              <h1 className="heading-balance mt-4 text-4xl font-black leading-[1.04] tracking-[-0.045em] md:text-6xl">
                חבילות מוצרי חשמל שבנויות לחיים עצמם
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 md:text-lg md:leading-8">
                לא עוד רשימת מוצרים אקראית. בחרו את המצב שמתאים לכם וקבלו סל מומלץ, הסבר לכל בחירה ודגמים אמיתיים מתוך הקטלוג העדכני.
              </p>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-white/76">
                <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">15 חבילות ממוקדות</span>
                <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">מלאי מתעדכן</span>
                <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">הוספה מרוכזת לסל</span>
              </div>
            </div>
            <div className="relative mt-8 min-h-[18rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 md:mt-0 md:min-h-[25rem]">
              <Image
                src={BUNDLES[0].image}
                alt="מבחר מוצרי חשמל בחבילות לבית"
                fill
                priority
                loading="eager"
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071a2c]/55 via-transparent to-transparent" />
              <p className="absolute bottom-4 right-4 left-4 rounded-xl bg-[#071a2c]/74 px-4 py-3 text-xs leading-5 text-white/78 backdrop-blur">
                התמונות ממחישות את הרכב החבילה. הדגמים המדויקים והזמינות מופיעים בכל עמוד.
              </p>
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-20" aria-labelledby="bundle-grid-heading">
          <div className="max-w-3xl">
            <p className="section-kicker">בחרו לפי הצורך, לא לפי המבצע</p>
            <h2 id="bundle-grid-heading" className="section-title mt-3">איזו חבילה מתאימה לבית שלכם?</h2>
            <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
              כל עמוד נכתב כמדריך קנייה עצמאי וכולל רשימת מדידות, תשתיות ושאלות שחשוב לסגור לפני הזמנה.
            </p>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BUNDLES.map((bundle, index) => (
              <article
                key={bundle.slug}
                className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-white shadow-[0_22px_60px_-45px_rgba(10,22,36,0.55)] transition duration-500 hover:-translate-y-1 hover:border-brand-gold/45 hover:shadow-[0_28px_70px_-42px_rgba(10,22,36,0.5)]"
              >
                <Link href={`/bundles/${bundle.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-surface">
                  <Image
                    src={bundle.image}
                    alt={bundle.imageAlt}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071a2c]/52 via-transparent to-transparent" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-extrabold text-brand-blue shadow-sm backdrop-blur">
                    חבילה {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-4 right-4 rounded-full bg-[#071a2c]/78 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
                    עד {bundle.slots.length} מוצרים
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <p className="text-[11px] font-extrabold tracking-[0.11em] text-brand-gold">{bundle.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-black leading-tight tracking-[-0.03em] text-graphite">
                    <Link href={`/bundles/${bundle.slug}`} className="hover:text-brand-blue">{bundle.shortTitle}</Link>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-graphite-soft/72">{bundle.description}</p>
                  <Link href={`/bundles/${bundle.slug}`} className="mt-auto pt-5 text-sm font-extrabold text-brand-blue hover:underline">
                    לצפייה בהמלצה ובמוצרים ←
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-line/70 bg-surface py-14 md:py-20" aria-labelledby="how-heading">
          <div className="container-page">
            <p className="section-kicker">כך משתמשים בחבילות</p>
            <h2 id="how-heading" className="section-title mt-3">שלושה צעדים מבית ריק לבקשה מסודרת</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["01", "בוחרים תרחיש", "נכנסים לחבילה שמתאימה לשלב בחיים, לגודל הבית ולהרגלים."],
                ["02", "בודקים התאמה", "עוברים על המידות, התשתיות וההסבר שמופיע ליד כל מוצר."],
                ["03", "שולחים בקשה", "מוסיפים את כל החבילה, עורכים את הסל ושולחים לצוות לבדיקת מלאי והצעה."],
              ].map(([number, title, text]) => (
                <article key={number} className="surface-card rounded-[1.6rem] p-6">
                  <span className="text-xs font-black tracking-[0.14em] text-brand-gold">{number}</span>
                  <h3 className="mt-8 text-xl font-black text-graphite">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-graphite-soft/72">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-20" aria-labelledby="bundle-faq-heading">
          <div className="mx-auto max-w-4xl">
            <p className="section-kicker">לפני שבוחרים</p>
            <h2 id="bundle-faq-heading" className="section-title mt-3">שאלות על חבילות המוצרים</h2>
            <div className="mt-7"><FaqAccordion items={INDEX_FAQ} /></div>
          </div>
        </section>
      </div>

      <JsonLd
        data={[
          collectionPageJsonLd({
            name: "חבילות מוצרי חשמל מומלצות לבית",
            description: "15 חבילות מוצרי חשמל לפי שלב בחיים וסוג הבית.",
            path: "/bundles",
            image: BUNDLES[0].image,
            items: BUNDLES.map((bundle) => ({ name: bundle.title, path: `/bundles/${bundle.slug}`, image: bundle.image })),
          }),
          faqJsonLd(INDEX_FAQ),
        ]}
      />
    </>
  );
}
