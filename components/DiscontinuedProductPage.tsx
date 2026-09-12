import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import type { DiscontinuedProduct } from "@/lib/seo/discontinued";
import { BUSINESS } from "@/lib/utils";

/**
 * What a model-number URL becomes once the model is gone.
 *
 * The visitor searched an exact model and is ready to buy, so the page leads
 * with the honest answer — this one is no longer stocked — and immediately
 * gives them somewhere to go. It does not name a successor: the catalog knows
 * what is in the same category and in stock, not which model replaces which.
 */
export function DiscontinuedProductPage({ slug, data }: { slug: string; data: DiscontinuedProduct }) {
  const inStock = data.alternatives.filter((p) => p.availability === "in_stock");
  const message = `שלום, חיפשתי את הדגם ${data.name} (${data.modelNumber}) ונראה שהוא כבר לא בקטלוג. יש דגם מקביל שתוכלו להציע?`;

  return (
    <>
      <Breadcrumbs items={[{ name: data.name, path: `/products/${slug}` }]} />
      <div className="container-page pb-12 md:pb-16">
        <div className="page-intro-shell">
          <p className="section-kicker">הדגם אינו בקטלוג</p>
          <h1 className="heading-balance mt-2 text-2xl font-black leading-[1.1] tracking-[-0.03em] text-graphite md:text-4xl">
            {data.name}
          </h1>
          <div className="mt-4 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/85 md:text-base">
            <p>
              הדגם הזה (מק״ט {data.modelNumber}) כבר לא מופיע בקטלוג הפעיל שלנו. יצרנים ויבואנים
              מחליפים דגמים מדי שנה, ולרוב יש דגם מקביל או מעודכן שממלא את אותו תפקיד.
            </p>
            <p className="mt-3">
              {inStock.length > 0
                ? "אלה הדגמים מאותה קטגוריה שזמינים אצלנו כרגע. אם חיפשתם את הדגם הזה במיוחד — שלחו לנו הודעה ונגיד לכם מה המקביל המדויק שלו."
                : "כרגע אין לנו מלאי זמין באותה קטגוריה. שלחו לנו הודעה ונבדוק מול היבואן מה החליף את הדגם הזה."}
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton message={message} label="לשאול מה החליף את הדגם" trackAs="whatsapp_click_product" trackSlug={slug} />
            <PhoneButton phone={BUSINESS.phoneDisplay} label="להתקשר לחנות" />
          </div>
        </div>

        {data.alternatives.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="alternatives-heading">
            <h2 id="alternatives-heading" className="text-lg font-bold text-graphite md:text-2xl">
              דגמים מאותה קטגוריה
            </h2>
            <div className="mt-4">
              <ProductGrid products={data.alternatives} />
            </div>
          </section>
        )}

        {data.categorySlug && (
          <p className="mt-8 text-sm">
            <Link href={`/categories/${data.categorySlug}`} className="font-semibold text-brand-blue hover:underline">
              לכל הדגמים בקטגוריה ←
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
