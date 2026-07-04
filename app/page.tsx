import Link from "next/link";
import { Hero } from "@/components/Hero";
import { CategorySearchBox } from "@/components/CategorySearchBox";
import { ProductGrid } from "@/components/ProductGrid";
import { BrandStrip } from "@/components/BrandStrip";
import { ContactStrip } from "@/components/ContactStrip";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { getCategories, getBrands, getFeaturedProducts, getPopularProducts } from "@/lib/base44/catalog";
import { FAQ_ITEMS } from "@/content/faq";
import { faqJsonLd } from "@/lib/schema/jsonld";

export const revalidate = 10800; // 3 hours

const WHY_CHOOSE = [
  { title: "חנות פיזית בנהריה", desc: "ניתן להגיע, לראות ולהתייעץ עם הצוות במקום." },
  { title: "שירות אישי ומקצועי", desc: "ליווי אישי בהתאמת המוצר הנכון לבית שלכם." },
  { title: "קטלוג מוצרים נוח לחיפוש", desc: "חיפוש חכם לפי שם, מותג, מק״ט או קטגוריה." },
  { title: "בדיקת זמינות מהירה", desc: "סטטוס זמינות ברור לכל מוצר בקטלוג." },
  { title: "הזמנה ישירה וקלה", desc: "קנייה בטוחה וישירה מול צוות החנות בוואטסאפ או בטלפון." },
  { title: "שירות לנהריה והצפון", desc: "מלווים לקוחות מנהריה ומכל אזור הצפון." },
];

export default async function HomePage() {
  const [categories, brands, featuredProducts, popularProducts] = await Promise.all([
    getCategories(),
    getBrands(),
    getFeaturedProducts(8),
    getPopularProducts(8),
  ]);

  return (
    <>
      <Hero />

      <section className="container-page py-8 md:py-20" aria-labelledby="explore-heading">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
          <h2 id="explore-heading" className="text-xl font-bold text-graphite md:text-3xl">
            גלו לפי קטגוריה
          </h2>
          <Link href="/categories" className="hidden text-sm font-semibold text-brand-blue hover:underline md:block">
            לכל הקטגוריות
          </Link>
        </div>
        <CategorySearchBox categories={categories} limit={12} />
        <Link
          href="/categories"
          className="mt-4 inline-flex text-sm font-semibold text-brand-blue hover:underline md:hidden"
        >
          לכל הקטגוריות ←
        </Link>
      </section>

      <section className="bg-surface py-8 md:py-20" aria-labelledby="featured-heading">
        <div className="container-page">
          <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
            <h2 id="featured-heading" className="text-xl font-bold text-graphite md:text-3xl">
              מוצרים נבחרים
            </h2>
            <Link href="/products" className="hidden text-sm font-semibold text-brand-blue hover:underline md:block">
              לכל המוצרים
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <section className="container-page py-8 md:py-20" aria-labelledby="popular-heading">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
          <h2 id="popular-heading" className="text-xl font-bold text-graphite md:text-3xl">
            מוצרים זמינים במלאי
          </h2>
          <Link
            href="/products?inStock=true"
            className="hidden text-sm font-semibold text-brand-blue hover:underline md:block"
          >
            לכל המוצרים הזמינים
          </Link>
        </div>
        <ProductGrid products={popularProducts} />
      </section>

      <section className="bg-surface py-10 md:py-20" aria-labelledby="brands-heading">
        <div className="container-page">
          <h2 id="brands-heading" className="mb-5 text-xl font-bold text-graphite md:mb-8 md:text-3xl">
            מותגים מובילים
          </h2>
          <Reveal>
            <BrandStrip brands={brands.slice(0, 14)} />
          </Reveal>
        </div>
      </section>

      <section className="container-page py-10 md:py-20" aria-labelledby="why-heading">
        <h2 id="why-heading" className="mb-5 text-xl font-bold text-graphite md:mb-8 md:text-3xl">
          למה לקנות אצל חדד יובל אלקטריק?
        </h2>
        <Reveal stagger className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {WHY_CHOOSE.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-white p-5 md:p-6">
              <h3 className="text-[15px] font-bold text-graphite md:text-base">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite-soft/80 md:mt-2">{item.desc}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="bg-surface py-10 md:py-20" aria-labelledby="local-heading">
        <div className="container-page">
          <h2 id="local-heading" className="text-xl font-bold text-graphite md:text-3xl">
            מוצרי חשמל בנהריה והצפון
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-graphite-soft/90 md:mt-4 md:text-base">
            החנות שלנו ממוקמת בלוחמי הגטאות 3, נהריה, ומשרתת לקוחות פרטיים מכל אזור הצפון — מקו חיפה ועד הגבול עם
            לבנון, כולל עכו, קריות, כרמיאל, מעלות-תרשיחא, שלומי וקריית שמונה. ניתן לעיין בקטלוג המוצרים באתר, לבדוק
            זמינות כללית ולפנות לצוות החנות לתיאום הזמנה או ביקור בחנות.
          </p>
          <div className="scroll-x-fade mt-5 flex gap-2 md:mt-6 md:flex-wrap">
            {[
              { href: "/electric-appliances-nahariya", label: "נהריה" },
              { href: "/electric-appliances-north", label: "הצפון" },
              { href: "/electric-appliances-haifa", label: "חיפה והצפון" },
              { href: "/electric-appliances-acre", label: "עכו והגליל המערבי" },
              { href: "/electric-appliances-krayot", label: "קריות" },
              { href: "/electric-appliances-carmiel", label: "כרמיאל" },
              { href: "/electric-appliances-maalot", label: "מעלות ושלומי" },
              { href: "/electric-appliances-shlomi", label: "שלומי" },
              { href: "/electric-appliances-kiryat-shmona", label: "קריית שמונה" },
            ].map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {area.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-8 md:py-10">
        <div className="rounded-2xl border border-line bg-brand-blue-light px-5 py-5 text-center text-sm text-graphite md:px-6 md:py-6 md:text-base">
          האתר מציג קטלוג מוצרים וזמינות כללית בלבד. אין באתר מחירים או סליקה. לבדיקת זמינות והזמנה ניתן לפנות
          בוואטסאפ או בטלפון — זמינות המלאי כפופה לאישור החנות.
        </div>
      </section>

      <section className="container-page py-10 md:py-20" aria-labelledby="faq-heading">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
          <h2 id="faq-heading" className="text-xl font-bold text-graphite md:text-3xl">
            שאלות נפוצות
          </h2>
          <Link href="/faq" className="hidden text-sm font-semibold text-brand-blue hover:underline md:block">
            לכל השאלות
          </Link>
        </div>
        <FaqAccordion items={FAQ_ITEMS.slice(0, 4)} />
        <JsonLd data={faqJsonLd(FAQ_ITEMS.slice(0, 4))} />
      </section>

      <div className="container-page pb-12 md:pb-16">
        <ContactStrip />
      </div>
    </>
  );
}
