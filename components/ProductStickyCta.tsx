"use client";

import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppProductMessage, buildWhatsAppUrl, telHref } from "@/lib/whatsapp/messages";
import { BUSINESS, cx } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * Mobile-only sticky bottom action bar for the product detail page:
 * הוסף לבקשה / וואטסאפ / התקשר — always reachable without scrolling back up.
 * Hidden on md+ where the inline action buttons are already visible.
 */
export function ProductStickyCta({ product }: { product: Product }) {
  const { addItem, removeItem, isInBasket } = useRequestBasket();
  const inBasket = isInBasket(product.modelNumber);

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

  const buttonBase =
    "tap-scale tap-target flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold leading-none transition-colors";

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white/95 p-2.5 shadow-[0_-8px_24px_-12px_rgba(16,21,28,0.18)] backdrop-blur-lg md:hidden">
      <button
        type="button"
        onClick={handleToggleBasket}
        aria-pressed={inBasket}
        className={cx(buttonBase, "border border-line text-graphite active:bg-surface")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 7h13l-1.5 9.5a2 2 0 0 1-2 1.7H8.9a2 2 0 0 1-2-1.7L5 4H3"
          />
          <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
        </svg>
        {inBasket ? "הוסר ✓" : "הוסף לבקשה"}
      </button>

      <a
        href={buildWhatsAppUrl(buildWhatsAppProductMessage(product))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click_product", { model_number: product.modelNumber })}
        className={cx(buttonBase, "bg-[#25D366] text-white active:bg-[#1fbd5a]")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38A9.94 9.94 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.2c-1.6 0-3.15-.43-4.5-1.24l-.32-.19-3.12.82.83-3.04-.21-.32A8.18 8.18 0 0 1 3.8 12c0-4.55 3.7-8.24 8.24-8.24 4.55 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.2-8.24 8.2Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.56.12-.17.25-.64.8-.79.96-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.15-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
        </svg>
        וואטסאפ
      </a>

      <a
        href={telHref(BUSINESS.phoneDisplay)}
        onClick={() => trackEvent("phone_click", { phone: BUSINESS.phoneDisplay })}
        className={cx(buttonBase, "bg-brand-blue text-white active:bg-brand-blue-dark")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
        </svg>
        התקשר
      </a>
    </div>
  );
}
