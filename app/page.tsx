import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ProductGrid } from "@/components/ProductGrid";
import { BrandStrip } from "@/components/BrandStrip";
import { ContactStrip } from "@/components/ContactStrip";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { GoogleRating } from "@/components/GoogleRating";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCategories, getBrands, getFeaturedProducts } from "@/lib/base44/catalog";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { FAQ_ITEMS } from "@/content/faq";
import { LOCAL_PAGES } from "@/content/localPages";
import { faqJsonLd } from "@/lib/schema/jsonld";

export const revalidate = 10800;

const FEATURED_CATEGORY_SLUGS = [
  "refrigerators",
  "washing-machines",
  "tvs",
  "air-conditioners",
  "ovens",
  "vacuum-cleaners",
];

const WHY_CHOOSE = [
  { number: "01", title: "מכירים את הבית", desc: "ייעוץ אנושי שמתחשב במידות, בהרגלים ובתקציב — לפני שבוחרים דגם." },
  { number: "02", title: "מגיעים עד אליכם", desc: "משלוח והתקנה מתואמים מנהריה ועד רמת הגולן וקריית שמונה." },
  { number: "03", title: "נשארים הכתובת", desc: "חנות פיזית וצוות מקומי שממשיך ללוות גם אחרי שהמוצר בבית." },
];

export default async function HomePage() {
  const [categories, brands, featuredProducts] = await Promise.all([
    getCategories(),
    getBrands(),
    getFeaturedProducts(4),
  ]);

  const preferredCategories = FEATURED_CATEGORY_SLUGS
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));
  const featuredCategories = preferredCategories.length >= 6 ? preferredCategories : categories.slice(0, 6);

  return (
    <>
      <Hero />

      <section className="container-page py-14 md:py-24" aria-labelledby="categories-heading">
        <div className="mb-7 flex items-end justify-between gap-5 md:mb-10">
          <div>
            <p className="section-kicker">כל הבית במקום אחד</p>
            <h2 id="categories-heading" className="section-title mt-3">מה מחפשים לבית?</h2>
          </div>
          <Link href="/categories" className="hidden text-sm font-bold text-brand-blue hover:underline md:block">
            לכל הקטגוריות ←
          </Link>
        </div>
        <CategoryTiles categories={featuredCategories} />
        <Link href="/categories" className="mt-6 inline-flex text-sm font-bold text-brand-blue hover:underline md:hidden">
          לכל הקטגוריות ←
        </Link>
      </section>

      <section className="bg-surface py-14 md:py-24" aria-labelledby="featured-heading">
        <div className="container-page">
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-10">
            <div>
              <p className="section-kicker">נבחרו בקפידה</p>
              <h2 id="featured-heading" className="section-title mt-3">המומלצים שלנו</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-soft/68 md:text-base">
                דגמים בולטים עם זמינות עדכנית — לפרטים, ייעוץ והצעה אישית מצוות החנות.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-brand-blue px-4 py-2 text-white">מומלצים</span>
              <span className="rounded-full border border-line bg-white px-4 py-2 text-graphite-soft/65">במלאי</span>
              <span className="rounded-full border border-line bg-white px-4 py-2 text-graphite-soft/65">חדש באתר</span>
            </div>
          </div>
          <ProductGrid products={featuredProducts} />
          <div className="mt-8 text-center">
            <Link href="/products" className="inline-flex items-center rounded-full border border-graphite/15 bg-white px-6 py-3 text-sm font-bold text-graphite transition-colors hover:border-brand-blue/35 hover:text-brand-blue">
              לכל המוצרים בקטלוג ←
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-24" aria-labelledby="choice-heading">
        <div className="blueprint-grid relative overflow-hidden rounded-[2rem] bg-brand-blue-dark px-6 py-10 text-white shadow-[0_34px_80px_-50px_rgba(7,57,96,0.9)] sm:px-9 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:rounded-[2.5rem] md:px-14 md:py-14">
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-blue/45 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold tracking-[0.13em] text-brand-gold">3 שאלות · דקה אחת</p>
            <h2 id="choice-heading" className="heading-balance mt-3 text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">
              לא בטוחים מה לבחור?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              נמצא יחד את המוצר שמתאים לבית, לתקציב ולשימוש שלכם — בלי ללכת לאיבוד בין עשרות דגמים.
            </p>
          </div>
          <div className="relative mt-7 md:mt-0">
            <WhatsAppButton
              message={buildWhatsAppGeneralMessage()}
              label="עזרו לי לבחור"
              variant="outline"
              size="lg"
              trackAs="whatsapp_click_header"
              className="!border-white/15 !bg-white !px-8 !font-bold !text-brand-blue-dark hover:!bg-brand-blue-light"
            />
          </div>
        </div>
      </section>

      <section className="container-page pb-14 md:pb-24" aria-labelledby="lifestyle-heading">
        <div className="grid overflow-hidden rounded-[2rem] border border-line/70 bg-white shadow-[0_32px_85px_-58px_rgba(10,22,36,0.55)] md:grid-cols-[1.18fr_0.82fr] md:rounded-[2.5rem]">
          <div className="relative min-h-[22rem] md:min-h-[34rem]">
            <Image
              src="/images/redesign/home-living.png"
              alt="סלון מודרני עם טלוויזיה כחלק מעיצוב הבית"
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
              loading="eager"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12 lg:p-16">
            <p className="section-kicker">טכנולוגיה שחיה נכון בבית</p>
            <h2 id="lifestyle-heading" className="section-title mt-4">מוצרים שנבחרו לחיים בבית</h2>
            <p className="mt-5 text-sm leading-7 text-graphite-soft/72 md:text-base">
              מקרר שמתאים למטבח, טלוויזיה שמתאימה לסלון ומכונה שמתאימה לשגרה. אנחנו מסתכלים על הבית כולו — לא רק על המפרט.
            </p>
            <Link href="/products" className="mt-7 inline-flex w-fit items-center text-sm font-bold text-brand-blue hover:underline">
              לגלות את הקולקציה ←
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-line/70 bg-white py-12 md:py-16" aria-labelledby="brands-heading">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-kicker">שמות שאפשר לסמוך עליהם</p>
              <h2 id="brands-heading" className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-graphite md:text-3xl">
                המותגים המובילים במקום אחד
              </h2>
            </div>
            <Reveal className="md:max-w-3xl">
              <BrandStrip brands={brands.slice(0, 12)} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-24" aria-labelledby="why-heading">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="section-kicker">מקומיים. מקצועיים. זמינים.</p>
            <h2 id="why-heading" className="section-title mt-3">למה לקנות אצל חדד?</h2>
            <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">
              החיבור בין קטלוג דיגיטלי נוח לבין אנשים אמיתיים שמכירים את המוצרים ואת אזור הצפון.
            </p>
          </div>
          <Reveal stagger className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {WHY_CHOOSE.map((item) => (
              <article key={item.number} className="surface-card rounded-[1.6rem] p-5 md:p-6">
                <span className="text-xs font-extrabold tracking-[0.13em] text-brand-gold">{item.number}</span>
                <h3 className="mt-8 text-lg font-extrabold tracking-[-0.025em] text-graphite">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite-soft/68">{item.desc}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-surface py-14 md:py-20" aria-labelledby="reviews-heading">
        <div className="container-page grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-14">
          <div>
            <p className="section-kicker">האמון שלכם הוא המדד שלנו</p>
            <h2 id="reviews-heading" className="section-title mt-3">לקוחות הצפון ממליצים</h2>
            <p className="mt-4 text-sm leading-7 text-graphite-soft/70 md:text-base">
              הדירוג מחובר ישירות לפרופיל העסק ב־Google. לחצו כדי לקרוא את הביקורות המקוריות.
            </p>
          </div>
          <GoogleRating className="!rounded-[1.6rem] !border-transparent !px-6 !py-6 md:!px-8 md:!py-8" />
        </div>
      </section>

      <section className="container-page py-14 md:py-20" aria-labelledby="local-heading">
        <div className="page-intro-shell">
          <p className="section-kicker">חנות מוצרי חשמל בנהריה</p>
          <h2 id="local-heading" className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-graphite md:text-4xl">
            שירות מקומי שמגיע לכל הצפון
          </h2>
          <div className="mt-5 max-w-4xl space-y-4 text-sm leading-7 text-graphite-soft/78 md:text-base">
            <p>
              חדד יובל אלקטריק היא חנות מוצרי חשמל מקומית וותיקה ברחוב לוחמי הגטאות 3, נהריה. בקטלוג תמצאו מקררים, כביסה, טלוויזיות, מיזוג, מוצרי מטבח ומוצרים קטנים ממותגים מובילים.
            </p>
            <p>
              מעיינים באתר, בודקים זמינות ושולחים וואטסאפ או מתקשרים. הצוות חוזר עם הצעה אישית ומתאם אספקה והתקנה — מנהריה ועכו, דרך הקריות וכרמיאל ועד צפת, טבריה, קריית שמונה ורמת הגולן.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {LOCAL_PAGES.slice(0, 12).map((area) => (
              <Link key={area.path} href={area.path} className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-graphite transition-colors hover:border-brand-blue/35 hover:text-brand-blue">
                {area.city}
              </Link>
            ))}
            <Link href="/services/delivery" className="rounded-full bg-brand-blue-light px-4 py-2 text-xs font-bold text-brand-blue">
              לכל אזורי המשלוח ←
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page pb-14 md:pb-20" aria-labelledby="faq-heading">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">לפני שמחליטים</p>
            <h2 id="faq-heading" className="section-title mt-3">שאלות נפוצות</h2>
          </div>
          <Link href="/faq" className="hidden text-sm font-bold text-brand-blue hover:underline md:block">לכל השאלות ←</Link>
        </div>
        <FaqAccordion items={FAQ_ITEMS.slice(0, 4)} />
        <JsonLd data={faqJsonLd(FAQ_ITEMS.slice(0, 4))} />
      </section>

      <div className="container-page pb-14 md:pb-20">
        <ContactStrip />
      </div>
    </>
  );
}
