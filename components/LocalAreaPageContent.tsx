import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { CategorySearchBox } from "@/components/CategorySearchBox";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import type { LocalPageContent } from "@/content/localPages";
import type { Category } from "@/types/category";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

export function LocalAreaPageContent({
  content,
  categories,
}: {
  content: LocalPageContent;
  categories: Category[];
}) {
  return (
    <>
      <Breadcrumbs items={[{ name: content.h1, path: content.path }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">{content.h1}</h1>

        <div className="mt-4 max-w-3xl md:mt-5">
          <SeoTextBlock>
            {content.intro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </SeoTextBlock>
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-surface p-4 md:mt-6 md:p-5">
          <p className="text-sm font-semibold text-graphite">אזורי שירות:</p>
          <p className="mt-1 text-sm text-graphite-soft/80">{content.areasServed.join(" · ")}</p>
          <p className="mt-3 text-xs text-graphite-soft/60">
            החנות הפיזית ממוקמת ב{BUSINESS.addressStreet}, {BUSINESS.addressCity}.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
          <Link
            href="/products"
            className="tap-target inline-flex items-center justify-center rounded-full bg-graphite px-5 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
          >
            צפו בקטלוג
          </Link>
          <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
          <PhoneButton phone={BUSINESS.phoneDisplay} />
          <Link
            href="/contact"
            className="tap-target inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-graphite hover:bg-surface"
          >
            צור קשר
          </Link>
        </div>

        <section className="mt-10 md:mt-14" aria-labelledby="local-categories-heading">
          <h2 id="local-categories-heading" className="text-lg font-bold text-graphite md:text-2xl">
            קטגוריות מוצרים
          </h2>
          <div className="mt-4">
            <CategorySearchBox categories={categories} limit={12} />
          </div>
        </section>
      </div>
    </>
  );
}
