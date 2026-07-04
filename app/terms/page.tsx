import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { ContentSections } from "@/components/ContentSections";
import { TERMS_INTRO, TERMS_LAST_UPDATED, TERMS_SECTIONS } from "@/content/terms";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "תנאי שימוש",
  description:
    "תנאי השימוש באתר חדד יובל אלקטריק בע״מ — קטלוג מוצרי חשמל בנהריה. מידע על שימוש באתר, זמינות מוצרים, הגבלת אחריות וקניין רוחני.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "תנאי שימוש", path: "/terms" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">תנאי שימוש</h1>
        <p className="mt-2 text-sm text-graphite-soft/60">עודכן לאחרונה: {TERMS_LAST_UPDATED}</p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-graphite-soft/90">{TERMS_INTRO}</p>

        <div className="mt-6 max-w-3xl">
          <SeoTextBlock>
            <ContentSections sections={TERMS_SECTIONS} />
          </SeoTextBlock>
        </div>

        <p className="mt-10 max-w-3xl text-sm text-graphite-soft/70">
          לשאלות בנוגע לתנאי השימוש,{" "}
          <Link href="/contact" className="font-medium text-brand-blue hover:underline">
            צרו קשר
          </Link>
          . ראו גם{" "}
          <Link href="/privacy-policy" className="font-medium text-brand-blue hover:underline">
            מדיניות הפרטיות
          </Link>{" "}
          ו{" "}
          <Link href="/accessibility" className="font-medium text-brand-blue hover:underline">
            הצהרת הנגישות
          </Link>
          .
        </p>
      </div>
    </>
  );
}
