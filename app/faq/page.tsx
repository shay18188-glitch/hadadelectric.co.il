import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ContactStrip } from "@/components/ContactStrip";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/content/faq";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "שאלות נפוצות — מוצרי חשמל בנהריה",
  description:
    "שאלות ותשובות על קטלוג מוצרי החשמל, זמינות, הזמנה בוואטסאפ, אזור השירות וייעוץ — חדד יובל אלקטריק בע״מ, נהריה והצפון.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "שאלות נפוצות", path: "/faq" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">שאלות נפוצות</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-graphite-soft/90">
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

        <div className="mt-10 max-w-3xl space-y-10">
          {FAQ_CATEGORIES.map((category) => (
            <section key={category.title} aria-labelledby={`faq-${category.title}`}>
              <h2 id={`faq-${category.title}`} className="mb-4 text-xl font-bold text-graphite md:text-2xl">
                {category.title}
              </h2>
              <FaqAccordion items={category.items} />
            </section>
          ))}
        </div>

        <div className="mt-14">
          <ContactStrip />
        </div>

        <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      </div>
    </>
  );
}
