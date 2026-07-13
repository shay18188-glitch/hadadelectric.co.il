import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { AboutSections } from "@/components/ContentSections";
import { ContactStrip } from "@/components/ContactStrip";
import { GoogleRating } from "@/components/GoogleRating";
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
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">אודות {BUSINESS.nameHe}</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:mt-4 md:text-lg">
          {ABOUT_INTRO}
        </p>

        <div className="mt-5 max-w-md md:mt-6">
          <GoogleRating />
        </div>

        <div className="mt-6 max-w-3xl md:mt-8">
          <SeoTextBlock>
            <AboutSections sections={ABOUT_SECTIONS} />
          </SeoTextBlock>
        </div>

        <div className="scroll-x-fade mt-8 flex gap-2.5 md:mt-10 md:flex-wrap md:gap-3">
          <Link
            href="/products"
            className="tap-target shrink-0 inline-flex items-center justify-center rounded-full bg-graphite px-5 py-3 text-sm font-semibold text-white hover:bg-graphite-soft md:px-6"
          >
            צפו בקטלוג מוצרי החשמל
          </Link>
          <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" className="shrink-0" />
          <Link
            href="/contact"
            className="tap-target shrink-0 inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-graphite hover:bg-surface md:px-6"
          >
            צור קשר
          </Link>
          <Link
            href="/electric-appliances-nahariya"
            className="tap-target shrink-0 inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-graphite hover:bg-surface md:px-6"
          >
            מוצרי חשמל בנהריה
          </Link>
          <a
            href={BUSINESS.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target shrink-0 inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-graphite hover:bg-surface md:px-6"
          >
            עמוד הפייסבוק שלנו
          </a>
        </div>

        <div className="mt-10 md:mt-14">
          <ContactStrip />
        </div>
      </div>
    </>
  );
}
