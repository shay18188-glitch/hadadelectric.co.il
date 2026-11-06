"use client";

import Link from "next/link";
import { useRequestBasket } from "@/components/RequestBasketProvider";
import {
  BAR_PRIMARY_BASE_CLASS,
  BAR_PRIMARY_CLASS,
  BAR_PRIMARY_ICON_CLASS,
  BAR_SECONDARY_CLASS,
  BAR_TEXT_SIZE,
  BarIcon,
  BottomActionBarShell,
} from "@/components/BottomActionBar";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppProductMessage, buildWhatsAppUrl, telHref } from "@/lib/whatsapp/messages";
import { BUSINESS, cx } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * Mobile-only bottom bar for the product detail page, in the same style as
 * the global bar: "add to request" as the wide primary (it turns into
 * "send the request" once added, the next step of the lead), plus call and
 * WhatsApp about this exact model. Hidden on md+ where the inline buttons are
 * visible.
 */
export function ProductStickyCta({ product }: { product: Product }) {
  const { addItem, isInBasket } = useRequestBasket();
  const inBasket = isInBasket(product.modelNumber);

  function handleAdd() {
    addItem({
      modelNumber: product.modelNumber,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      brand: product.brand,
    });
    trackEvent("product_add_to_request", { model_number: product.modelNumber, placement: "product_bar" });
  }

  return (
    <BottomActionBarShell label="פעולות למוצר">
      {inBasket ? (
        <Link href="/request" className={cx(BAR_PRIMARY_BASE_CLASS, BAR_TEXT_SIZE.he.primary, "bg-success")}>
          <BarIcon name="check" className={BAR_PRIMARY_ICON_CLASS} />
          <span className="truncate">לשליחת הבקשה</span>
        </Link>
      ) : (
        <button type="button" onClick={handleAdd} className={cx(BAR_PRIMARY_CLASS, BAR_TEXT_SIZE.he.primary)}>
          <BarIcon name="basket" className={BAR_PRIMARY_ICON_CLASS} />
          <span className="truncate">הוסף לבקשה</span>
        </button>
      )}

      <a
        href={telHref(BUSINESS.phoneDisplay)}
        onClick={() => trackEvent("phone_click", { phone: BUSINESS.phoneDisplay, placement: "product_bar" })}
        className={cx(BAR_SECONDARY_CLASS, BAR_TEXT_SIZE.he.secondary)}
      >
        <BarIcon name="phone" className="text-brand-blue" />
        שיחה
      </a>

      <a
        href={buildWhatsAppUrl(buildWhatsAppProductMessage(product))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click_product", { model_number: product.modelNumber, slug: product.slug, placement: "product_bar" })}
        className={cx(BAR_SECONDARY_CLASS, BAR_TEXT_SIZE.he.secondary)}
      >
        <BarIcon name="whatsapp" />
        WhatsApp
      </a>
    </BottomActionBarShell>
  );
}
