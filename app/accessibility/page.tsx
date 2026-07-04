import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { ContentSections } from "@/components/ContentSections";
import {
  ACCESSIBILITY_INTRO,
  ACCESSIBILITY_LAST_UPDATED,
  ACCESSIBILITY_SECTIONS,
} from "@/content/accessibility";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "הצהרת נגישות",
  description:
    "הצהרת הנגישות של אתר חדד יובל אלקטריק בע״מ — מאמצי הנגשה, אמצעים שיושמו, מגבלות ידועות ודרכי פנייה בנושא נגישות.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "הצהרת נגישות", path: "/accessibility" }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">הצהרת נגישות</h1>
        <p className="mt-2 text-sm text-graphite-soft/60">עודכן לאחרונה: {ACCESSIBILITY_LAST_UPDATED}</p>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:mt-4 md:text-base">{ACCESSIBILITY_INTRO}</p>

        <div className="mt-6 max-w-3xl">
          <SeoTextBlock>
            <ContentSections sections={ACCESSIBILITY_SECTIONS} />
          </SeoTextBlock>
        </div>

        <p className="mt-10 max-w-3xl text-sm text-graphite-soft/70">
          נתקלתם בבעיית נגישות?{" "}
          <Link href="/contact" className="font-medium text-brand-blue hover:underline">
            פנו אלינו
          </Link>{" "}
          ונשמח לסייע.
        </p>
      </div>
    </>
  );
}
