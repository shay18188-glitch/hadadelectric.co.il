"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Product } from "@/types/product";
import type { Locale } from "@/lib/i18n/locales";
import { getLocaleFromPathname, LOCALE_PREFIX } from "@/lib/i18n/locales";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppUrl, buildWhatsAppProductMessage } from "@/lib/whatsapp/messages";

import { cx } from "@/lib/utils";

const CARD_TEXT: Record<Locale, { added: string; add: string; details: string; whatsapp: string }> = {
  he: { added: "הוסר ✓", add: "הוסף לבקשה", details: "לפרטים", whatsapp: "הזמן בוואטסאפ" },
  en: { added: "Added ✓", add: "Add to request", details: "Details", whatsapp: "Order on WhatsApp" },
  ru: { added: "Добавлено ✓", add: "В заявку", details: "Подробнее", whatsapp: "Заказать в WhatsApp" },
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
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow sm:rounded-2xl sm:hover:shadow-md">
      <Link
        href={productHref}
        className="tap-scale relative block aspect-square overflow-hidden bg-surface"
        onClick={() => trackEvent("product_view", { model_number: product.modelNumber })}
      >
        <Image
          src={product.imageUrl || "/images/product-placeholder.svg"}
          alt={`${product.name} - חדד יובל אלקטריק בע״מ`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cx("object-contain p-3 transition-transform duration-300 sm:p-4 sm:group-hover:scale-105", !product.imageUrl && "opacity-40")}
        />
        <AvailabilityBadge availability={product.availability} locale={locale} className="absolute right-2 top-2 sm:right-3 sm:top-3" />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        {product.brand && <p className="text-[11px] font-medium text-brand-blue sm:text-xs">{product.brand}</p>}
        <Link href={productHref} className="focus-visible:outline-none">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-graphite hover:underline sm:text-sm md:text-base">
            {product.name}
          </h3>
        </Link>
        {product.category && <p className="text-[11px] text-graphite-soft/70 sm:text-xs">{product.category}</p>}

        <div className="mt-auto flex flex-col gap-1.5 pt-2 sm:gap-2 sm:pt-3">
          <div className="flex gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleToggleBasket}
              aria-pressed={inBasket}
              className="tap-scale flex-1 rounded-full border border-line px-2 py-2 text-[11px] font-semibold text-graphite transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue sm:px-3 sm:text-xs"
            >
              {inBasket ? t.added : t.add}
            </button>
            <Link
              href={productHref}
              className="tap-scale flex-1 rounded-full bg-graphite px-2 py-2 text-center text-[11px] font-semibold text-white transition-colors hover:bg-graphite-soft sm:px-3 sm:text-xs"
            >
              {t.details}
            </Link>
          </div>
          <a
            href={buildWhatsAppUrl(buildWhatsAppProductMessage(product, locale))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("whatsapp_click_product", { model_number: product.modelNumber })}
            className="tap-scale inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366]/10 px-2 py-2 text-[11px] font-semibold text-[#128C4A] transition-colors hover:bg-[#25D366]/20 sm:px-3 sm:text-xs"
          >
            {t.whatsapp}
          </a>
        </div>
      </div>
    </div>
  );
}
