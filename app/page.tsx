import Link from "next/link";
import { Hero } from "@/components/Hero";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ProductGrid } from "@/components/ProductGrid";
import { BrandStrip } from "@/components/BrandStrip";
import { ContactStrip } from "@/components/ContactStrip";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { getCategories, getBrands, getFeaturedProducts, getPopularProducts } from "@/lib/base44/catalog";
import { FAQ_ITEMS } from "@/content/faq";
import { faqJsonLd } from "@/lib/schema/jsonld";

export const revalidate = 1800;

const WHY_CHOOSE = [
  { title: "חנות פיזית בנהריה", desc: "ניתן להגיע, לראות ולהתייעץ עם הצוות במקום." },
  { title: "שירות אישי ומקצועי", desc: "ליווי אישי בהתאמת המוצר הנכון לבית שלכם." },
  { title: "קטלוג מוצרים נוח לחיפוש", desc: "חיפוש חכם לפי שם, מותג, מק״ט או קטגוריה." },
  { title: "בדיקת זמינות מהירה", desc: "סטטוס זמינות ברור לכל מוצר בקטלוג." },
  { title: "הזמנה ישירה בוואטסאפ או בטלפון", desc: "בלי הליכי סליקה מסורבלים — פנייה ישירה לצוות." },
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

      <section className="container-page py-14 md:py-20" aria-labelledby="explore-heading">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="explore-heading" className="text-2xl font-bold text-graphite md:text-3xl">
            גלו לפי קטגוריה
          </h2>
          <Link href="/products" className="hidden text-sm font-semibold text-brand-blue hover:underline md:block">
            לכל הקטגוריות
          </Link>
        </div>
        <CategoryTiles categories={categories.slice(0, 12)} />
      </section>

      <section className="bg-surface py-14 md:py-20" aria-labelledby="featured-heading">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="featured-heading" className="text-2xl font-bold text-graphite md:text-3xl">
              מוצרים נבחרים
            </h2>
            <Link href="/products" className="hidden text-sm font-semibold text-brand-blue hover:underline md:block">
              לכל המוצרים
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <section className="container-page py-14 md:py-20" aria-labelledby="popular-heading">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="popular-heading" className="text-2xl font-bold text-graphite md:text-3xl">
            מוצרים זמינים במלאי
          </h2>
          <Link
            href="/products?availability=in_stock"
            className="hidden text-sm font-semibold text-brand-blue hover:underline md:block"
          >
            לכל המוצרים הזמינים
          </Link>
        </div>
        <ProductGrid products={popularProducts} />
      </section>

      <section className="bg-surface py-14 md:py-20" aria-labelledby="brands-heading">
        <div className="container-page">
          <h2 id="brands-heading" className="mb-8 text-2xl font-bold text-graphite md:text-3xl">
            מותגים מובילים
          </h2>
          <BrandStrip brands={brands.slice(0, 14)} />
        </div>
      </section>

      <section className="container-page py-14 md:py-20" aria-labelledby="why-heading">
        <h2 id="why-heading" className="mb-8 text-2xl font-bold text-graphite md:text-3xl">
          למה לקנות אצל חדד יובל אלקטריק?
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-base font-bold text-graphite">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite-soft/80">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface py-14 md:py-20" aria-labelledby="local-heading">
        <div className="container-page">
          <h2 id="local-heading" className="text-2xl font-bold text-graphite md:text-3xl">
            מוצרי חשמל בנהריה והצפון
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-graphite-soft/90">
            החנות שלנו ממוקמת בלוחמי הגטאות 3, נהריה, ומשרתת לקוחות פרטיים מכל אזור הצפון — מקו חיפה ועד הגבול עם
            לבנון, כולל עכו, קריות, כרמיאל, מעלות-תרשיחא, שלומי וקריית שמונה. ניתן לעיין בקטלוג המוצרים באתר, לבדוק
            זמינות כללית ולפנות לצוות החנות לתיאום הזמנה או ביקור בחנות.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
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
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {area.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="rounded-2xl border border-line bg-brand-blue-light px-6 py-6 text-center text-sm text-graphite md:text-base">
          האתר מציג קטלוג מוצרים וזמינות כללית בלבד. אין באתר מחירים או סליקה. לבדיקת זמינות והזמנה ניתן לפנות
          בוואטסאפ או בטלפון — זמינות המלאי כפופה לאישור החנות.
        </div>
      </section>

      <section className="container-page py-14 md:py-20" aria-labelledby="faq-heading">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="faq-heading" className="text-2xl font-bold text-graphite md:text-3xl">
            שאלות נפוצות
          </h2>
          <Link href="/faq" className="hidden text-sm font-semibold text-brand-blue hover:underline md:block">
            לכל השאלות
          </Link>
        </div>
        <FaqAccordion items={FAQ_ITEMS.slice(0, 4)} />
        <JsonLd data={faqJsonLd(FAQ_ITEMS.slice(0, 4))} />
      </section>

      <div className="container-page pb-16">
        <ContactStrip />
      </div>
    </>
  );
}
