import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { FAQ_ITEMS } from "@/content/faq";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "שאלות נפוצות",
  description: "תשובות לשאלות נפוצות על הקטלוג, הזמינות ואופן ההזמנה בחדד יובל אלקטריק בע״מ.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "שאלות נפוצות", path: "/faq" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">שאלות נפוצות</h1>
        <p className="mt-3 max-w-2xl text-sm text-graphite-soft/80 md:text-base">
          כל מה שחשוב לדעת לפני עיון בקטלוג ושליחת בקשה.
        </p>
        <div className="mt-8 max-w-3xl">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
        <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      </div>
    </>
  );
}
