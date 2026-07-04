import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { ContentSections } from "@/components/ContentSections";
import { PRIVACY_INTRO, PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from "@/content/privacy";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "מדיניות פרטיות",
  description:
    "מדיניות הפרטיות של חדד יובל אלקטריק בע״מ — איזה מידע נאסף באתר, כיצד הוא משמש, זכויותיכם ויצירת קשר בנושא פרטיות.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "מדיניות פרטיות", path: "/privacy-policy" }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">מדיניות פרטיות</h1>
        <p className="mt-2 text-sm text-graphite-soft/60">עודכן לאחרונה: {PRIVACY_LAST_UPDATED}</p>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:mt-4 md:text-base">{PRIVACY_INTRO}</p>

        <div className="mt-6 max-w-3xl">
          <SeoTextBlock>
            <ContentSections sections={PRIVACY_SECTIONS} />
          </SeoTextBlock>
        </div>

        <p className="mt-10 max-w-3xl text-sm text-graphite-soft/70">
          לשאלות בנושא פרטיות,{" "}
          <Link href="/contact" className="font-medium text-brand-blue hover:underline">
            צרו קשר
          </Link>
          . ראו גם{" "}
          <Link href="/terms" className="font-medium text-brand-blue hover:underline">
            תנאי השימוש
          </Link>
          .
        </p>
      </div>
    </>
  );
}
