"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Product } from "@/types/product";
import type { Locale } from "@/lib/i18n/locales";
import { getLocaleFromPathname, LOCALE_PREFIX } from "@/lib/i18n/locales";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppUrl, buildWhatsAppProductMessage } from "@/lib/whatsapp/messages";
import { ProductImage } from "@/components/ProductImage";

import { cx } from "@/lib/utils";

const CARD_TEXT: Record<Locale, { added: string; add: string; details: string; whatsapp: string; model: string }> = {
  he: { added: "נוסף לבקשה", add: "הוספה לבקשה", details: "לפרטי המוצר", whatsapp: "ייעוץ בוואטסאפ", model: "דגם" },
  en: { added: "Added to request", add: "Add to request", details: "Product details", whatsapp: "WhatsApp advice", model: "Model" },
  ru: { added: "Добавлено", add: "В заявку", details: "Подробнее", whatsapp: "Консультация в WhatsApp", model: "Модель" },
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem, removeItem, isInBasket } = useRequestBasket();
  const inBasket = isInBasket(product.modelNumber);
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = CARD_TEXT[locale];
  const productHref = `${LOCALE_PREFIX[locale]}/products/${encodeURIComponent(product.slug)}`;

  function handleToggleBasket() {
    if (inBasket) {
      removeItem(product.modelNumber);
      trackEvent("product_remove_from_request", { model_number: product.modelNumber });
    } else {
      addItem({
        modelNumber: product.modelNumber,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl,
        brand: product.brand,
      });
      trackEvent("product_add_to_request", { model_number: product.modelNumber });
    }
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-line/80 bg-white shadow-[0_16px_50px_-38px_rgba(11,23,36,0.4)] transition duration-500 hover:-translate-y-1 hover:border-brand-gold/45 hover:shadow-[0_25px_60px_-35px_rgba(11,23,36,0.38)] md:rounded-[1.75rem]">
      <Link
        href={productHref}
        className="tap-scale relative block aspect-[1/1.02] overflow-hidden bg-[linear-gradient(145deg,#f7f5f0,#eeece6)]"
        onClick={() => trackEvent("product_view", { model_number: product.modelNumber })}
      >
        <ProductImage
          src={product.imageUrl || "/images/product-placeholder.svg"}
          alt={`${product.name} - חדד יובל אלקטריק בע״מ`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cx("object-contain p-5 transition-transform duration-700 sm:p-7 sm:group-hover:scale-[1.045]", !product.imageUrl && "opacity-40")}
        />
        <AvailabilityBadge availability={product.availability} locale={locale} className="absolute right-3 top-3 shadow-sm sm:right-4 sm:top-4" />
        <span className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-graphite shadow-md backdrop-blur transition-transform group-hover:scale-110 sm:bottom-4 sm:left-4" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          {product.brand && <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-blue sm:text-[11px]">{product.brand}</p>}
          <p className="text-[10px] text-graphite-soft/55 sm:text-[11px]">{t.model} {product.modelNumber}</p>
        </div>
        <Link href={productHref} className="focus-visible:outline-none">
          <h3 className="mt-2 line-clamp-2 min-h-[2.6em] text-[13px] font-bold leading-[1.35] text-graphite transition-colors group-hover:text-brand-blue sm:text-[15px]">
            {product.name}
          </h3>
        </Link>
        {product.category && <p className="mt-1.5 text-[11px] text-graphite-soft/65 sm:text-xs">{product.category}</p>}

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:pt-5">
          <div className="flex gap-2">
            <Link
              href={productHref}
              className="tap-scale flex-1 rounded-full bg-graphite px-2.5 py-2.5 text-center text-[11px] font-semibold text-white transition-colors hover:bg-brand-blue sm:px-4 sm:text-xs"
            >
              {t.details}
            </Link>
            <button
              type="button"
              onClick={handleToggleBasket}
              aria-pressed={inBasket}
              className={cx(
                "tap-scale rounded-full border px-3 py-2.5 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue sm:px-4 sm:text-xs",
                inBasket ? "border-brand-blue/30 bg-brand-blue-light text-brand-blue" : "border-line text-graphite hover:border-brand-blue/30 hover:bg-brand-blue-light",
              )}
            >
              {inBasket ? t.added : t.add}
            </button>
          </div>
          <a
            href={buildWhatsAppUrl(buildWhatsAppProductMessage(product, locale))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("whatsapp_click_product", { model_number: product.modelNumber })}
            className="tap-scale inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold text-[#128C4A] transition-colors hover:bg-[#25D366]/10 sm:text-xs"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true"><path d="M12.04 2A9.84 9.84 0 0 0 3.6 16.9L2 22l5.25-1.54A9.94 9.94 0 1 0 12.04 2Zm5.78 13.96c-.25.7-1.47 1.34-2.03 1.39-.52.05-1.18.07-1.9-.16-.44-.14-1-.33-1.72-.64-3.03-1.3-5-4.35-5.15-4.55-.15-.2-1.23-1.63-1.23-3.1 0-1.48.78-2.2 1.05-2.5.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.08.92 2.23.08.15.13.33.03.53-.1.2-.15.32-.3.5-.15.17-.32.38-.45.5-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.07.17-.2.75-.88.95-1.18.2-.3.4-.25.67-.15.28.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.72-.17 1.42Z" /></svg>
            {t.whatsapp}
          </a>
        </div>
      </div>
    </article>
  );
}
