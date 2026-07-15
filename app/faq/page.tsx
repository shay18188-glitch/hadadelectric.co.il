import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ContactStrip } from "@/components/ContactStrip";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/content/faq";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: "שאלות נפוצות — מוצרי חשמל בנהריה",
  description:
    "שאלות ותשובות על קטלוג מוצרי החשמל, זמינות, הזמנה בוואטסאפ, אזור השירות וייעוץ — חדד יובל אלקטריק בע״מ, נהריה והצפון.",
  path: "/faq",
  translations: TRANSLATED_PATHS["/faq"],
});

export default function FaqPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "שאלות נפוצות", path: "/faq" }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">שאלות נפוצות</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:mt-4 md:text-base">
          כאן תמצאו תשובות לשאלות נפוצות על הקטלוג, בדיקת זמינות, הזמנה בוואטסאפ, אזור השירות שלנו בנהריה והצפון,
          ועוד. לא מצאתם תשובה?{" "}
          <Link href="/contact" className="font-medium text-brand-blue hover:underline">
            צרו קשר
          </Link>{" "}
          או{" "}
          <Link href="/products" className="font-medium text-brand-blue hover:underline">
            עיינו בקטלוג
          </Link>
          .
        </p>

        <div className="mt-8 max-w-3xl space-y-8 md:mt-10 md:space-y-10">
          {FAQ_CATEGORIES.map((category) => (
            <section key={category.title} aria-labelledby={`faq-${category.title}`}>
              <h2 id={`faq-${category.title}`} className="mb-3 text-lg font-bold text-graphite md:mb-4 md:text-2xl">
                {category.title}
              </h2>
              <FaqAccordion items={category.items} />
            </section>
          ))}
        </div>

        <div className="mt-10 md:mt-14">
          <ContactStrip />
        </div>

        <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      </div>
    </>
  );
}
