import Image from "next/image";
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
  imageSrc,
  ltr = false,
}: {
  href: string;
  label: string;
  variant?: "inline" | "banner";
  categoryName?: string;
  imageSrc?: string;
  /** Flip the inline arrow for LTR (en/ru) pages. */
  ltr?: boolean;
}) {
  if (variant === "banner") {
    return (
      <aside
        className="not-prose relative isolate mt-10 flex min-h-[24rem] items-end overflow-hidden rounded-[2rem] bg-[#071a2c] text-white shadow-[0_32px_80px_-42px_rgba(7,26,44,0.85)] md:mt-12 md:min-h-[20rem] md:items-center"
        aria-label="מעבר לקטלוג המוצרים"
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 80vw"
            className="-z-20 object-cover object-center"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071a2c] via-[#071a2c]/72 to-transparent md:bg-gradient-to-l md:from-[#071a2c]/98 md:via-[#071a2c]/78 md:to-[#071a2c]/10" />
        <div className="w-full p-6 sm:p-8 md:max-w-2xl md:p-10">
          <p className="text-xs font-bold tracking-[0.12em] text-brand-gold">השלב הבא שלכם</p>
          <p className="mt-2 text-2xl font-black leading-tight md:text-3xl">
            {categoryName ? `מוכנים לבחור ${categoryName}?` : "מוכנים לבחור מוצר?"}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/76 md:text-[15px]">
            עיינו בקטלוג, בדקו זמינות וקבלו ייעוץ אישי מצוות החנות בנהריה — עם משלוח והתקנה עד הבית בכל אזור הצפון.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={href}
              className="tap-target group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-blue-dark shadow-[0_16px_35px_-20px_rgba(0,0,0,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-light sm:w-auto"
            >
              {label}
              <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
            </Link>
            <WhatsAppButton
              message={buildWhatsAppGeneralMessage()}
              trackAs="whatsapp_click_header"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <div className="not-prose flex w-full sm:w-auto">
      <Link
        href={href}
        className="tap-target group inline-flex w-full items-center justify-between gap-3 rounded-full border border-brand-blue/18 bg-brand-blue-light/70 py-2.5 pe-3 ps-5 text-sm font-bold text-brand-blue shadow-[0_14px_34px_-26px_rgba(11,87,147,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue/32 hover:bg-white hover:shadow-[0_18px_38px_-24px_rgba(11,87,147,0.65)] sm:w-auto md:text-[15px]"
      >
        {label}
        <span
          aria-hidden="true"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm transition-transform duration-300 group-hover:-translate-x-0.5"
        >
          {ltr ? "→" : "←"}
        </span>
      </Link>
    </div>
  );
}
