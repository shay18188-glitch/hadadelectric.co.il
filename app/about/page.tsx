import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { AboutSections } from "@/components/ContentSections";
import { ContactStrip } from "@/components/ContactStrip";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ABOUT_INTRO, ABOUT_SECTIONS } from "@/content/about";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "אודות חדד יובל אלקטריק — חנות מוצרי חשמל בנהריה",
  description:
    "הכירו את חדד יובל אלקטריק בע״מ — חנות מוצרי חשמל לבית בנהריה, משרתת לקוחות פרטיים בנהריה והצפון. קטלוג, ייעוץ מקצועי והזמנה בטלפון או בוואטסאפ.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "אודות", path: "/about" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">אודות {BUSINESS.nameHe}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-graphite-soft/90 md:text-lg">{ABOUT_INTRO}</p>

        <div className="mt-8 max-w-3xl">
          <SeoTextBlock>
            <AboutSections sections={ABOUT_SECTIONS} />
          </SeoTextBlock>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
          >
            צפו בקטלוג מוצרי החשמל
          </Link>
          <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-graphite hover:bg-surface"
          >
            צור קשר
          </Link>
          <Link
            href="/electric-appliances-nahariya"
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-graphite hover:bg-surface"
          >
            מוצרי חשמל בנהריה
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

        <div className="mt-14">
          <ContactStrip />
        </div>
      </div>
    </>
  );
}
