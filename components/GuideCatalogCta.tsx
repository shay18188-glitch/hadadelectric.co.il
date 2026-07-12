import Link from "next/link";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";

/**
 * SEO-safe call-to-action that pulls guide readers into the catalog.
 * Rendered on the server as a real <Link> (crawlable internal link with
 * descriptive anchor text) — never a JS-only button — so it strengthens
 * internal linking instead of harming it. Used in 2–3 spots per guide with
 * varied anchor text to avoid over-optimization.
 */
export function GuideCatalogCta({
  href,
  label,
  variant = "inline",
  categoryName,
}: {
  href: string;
  label: string;
  variant?: "inline" | "banner";
  categoryName?: string;
}) {
  if (variant === "banner") {
    return (
      <aside
        className="not-prose mt-10 rounded-2xl border border-line bg-brand-blue-light p-5 md:mt-12 md:p-6"
        aria-label="מעבר לקטלוג המוצרים"
      >
        <p className="text-lg font-bold text-graphite md:text-xl">
          {categoryName ? `מוכנים לבחור ${categoryName}?` : "מוכנים לבחור מוצר?"}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-graphite-soft/90 md:text-[15px]">
          עיינו בקטלוג, בדקו זמינות וקבלו ייעוץ אישי מצוות החנות בנהריה — עם משלוח והתקנה עד בית הלקוח בכל אזור
          הצפון.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5 md:gap-3">
          <Link
            href={href}
            className="tap-target inline-flex items-center justify-center rounded-full bg-graphite px-5 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
          >
            {label}
          </Link>
          <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
        </div>
      </aside>
    );
  }

  return (
    <div className="not-prose rounded-2xl border border-line bg-surface px-4 py-3 md:px-5 md:py-3.5">
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline md:text-[15px]"
      >
        {label}
        <span aria-hidden="true">←</span>
      </Link>
    </div>
  );
}
