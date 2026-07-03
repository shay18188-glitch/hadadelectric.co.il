"use client";

import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { cx } from "@/lib/utils";
import type { Product } from "@/types/product";

export function AddToRequestButton({ product, className }: { product: Product; className?: string }) {
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
      {inBasket ? "הוסר מהבקשה ✓" : "הוסף לבקשה"}
    </button>
  );
}
