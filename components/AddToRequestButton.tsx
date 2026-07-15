"use client";

import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { cx } from "@/lib/utils";
import type { Product } from "@/types/product";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n/locales";

const LABELS = {
  he: { added: "הוסר מהבקשה ✓", add: "הוסף לבקשה" },
  en: { added: "Removed from request ✓", add: "Add to request" },
  ru: { added: "Убрано из заявки ✓", add: "Добавить в заявку" },
} as const;

export function AddToRequestButton({ product, className }: { product: Product; className?: string }) {
  const t = LABELS[getLocaleFromPathname(usePathname())];
  const { addItem, removeItem, isInBasket } = useRequestBasket();
  const inBasket = isInBasket(product.modelNumber);

  function handleClick() {
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
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={inBasket}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-graphite transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue",
        className
      )}
    >
      {inBasket ? t.added : t.add}
    </button>
  );
}
