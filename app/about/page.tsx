import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "אודות",
  description: "חדד יובל אלקטריק בע״מ — חנות מוצרי חשמל בנהריה, משרתת לקוחות פרטיים בנהריה והצפון.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "אודות", path: "/about" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">אודות {BUSINESS.nameHe}</h1>

        <div className="mt-6 max-w-3xl">
          <SeoTextBlock>
            <p>
              {BUSINESS.nameHe} היא חנות מוצרי חשמל לבית הפועלת בנהריה, ומתמחה במכירת מוצרי חשמל לבית — מקררים,
              מכונות כביסה, תנורים, כיריים, טלוויזיות, מזגנים ועוד — לצד שירות אישי ומקצועי ללקוחות פרטיים.
            </p>
            <p>
              החנות ממוקמת ב{BUSINESS.addressStreet}, {BUSINESS.addressCity}, ומשרתת לקוחות מנהריה ומכל אזור הצפון —
              מקו חיפה ועד הגבול עם לבנון. באתר תוכלו לעיין בקטלוג המוצרים המלא, לבדוק זמינות כללית ולשלוח בקשה
              מרוכזת לצוות החנות בוואטסאפ או בטלפון.
            </p>
            <p>
              אנו מאמינים בשירות אישי, זמין וישיר — ללא הליכי סליקה מקוונים, עם דגש על ליווי הלקוח בבחירת המוצר
              המתאים ביותר עבורו.
            </p>
          </SeoTextBlock>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
          >
            צפו בקטלוג
          </Link>
          <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-graphite hover:bg-surface"
          >
            צור קשר
          </Link>
          <a
            href={BUSINESS.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-graphite hover:bg-surface"
          >
            עמוד הפייסבוק שלנו
          </a>
        </div>
      </div>
    </>
  );
}
