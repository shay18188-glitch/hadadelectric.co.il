"use client";

import Link from "next/link";
import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { cx } from "@/lib/utils";
import type { RequestBasketItem } from "@/types/product";

export function BundleAddAllButton({
  products,
  bundleSlug,
  bundleName,
  className,
  stickyMobile = false,
}: {
  products: RequestBasketItem[];
  bundleSlug: string;
  bundleName: string;
  className?: string;
  stickyMobile?: boolean;
}) {
  const { items, addItems } = useRequestBasket();
  const existingModels = new Set(items.map((item) => item.modelNumber));
  const missingProducts = products.filter((product) => !existingModels.has(product.modelNumber));
  const allAdded = products.length > 0 && missingProducts.length === 0;

  function handleAddAll() {
    if (missingProducts.length === 0) return;
    addItems(missingProducts);
    trackEvent("bundle_add_to_request", {
      slug: bundleSlug,
      bundle_name: bundleName,
      items_count: missingProducts.length,
    });
  }

  const label = allAdded
    ? `כל ${products.length} המוצרים בסל הבקשה`
    : missingProducts.length < products.length
      ? `הוסיפו עוד ${missingProducts.length} מוצרים מהחבילה`
      : `הוסיפו את כל ${products.length} המוצרים לסל`;

  const action = allAdded ? (
    <Link
      href="/request"
      className={cx(
        "tap-target inline-flex items-center justify-center rounded-full bg-success px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_35px_-20px_rgba(21,122,74,0.85)] transition hover:-translate-y-0.5 hover:brightness-95 md:text-base",
        className
      )}
    >
      {label} · לצפייה בבקשה ←
    </Link>
  ) : (
    <button
      type="button"
      onClick={handleAddAll}
      disabled={products.length === 0}
      className={cx(
        "tap-target inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_18px_38px_-20px_rgba(11,87,147,0.9)] transition hover:-translate-y-0.5 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
        className
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h13l-1.5 9.5a2 2 0 0 1-2 1.7H8.9a2 2 0 0 1-2-1.7L5 4H3M12 9v6M9 12h6" />
      </svg>
      {label}
    </button>
  );

  return (
    <>
      {action}
      {stickyMobile && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/94 p-2.5 shadow-[0_-16px_40px_-24px_rgba(10,22,36,0.5)] backdrop-blur-xl md:hidden">
          {allAdded ? (
            <Link href="/request" className="tap-target flex w-full items-center justify-center rounded-full bg-success px-5 py-3 text-sm font-extrabold text-white">
              החבילה בסל · לצפייה בבקשה
            </Link>
          ) : (
            <button type="button" onClick={handleAddAll} className="tap-target flex w-full items-center justify-center rounded-full bg-brand-blue px-5 py-3 text-sm font-extrabold text-white">
              הוסיפו את כל החבילה · {missingProducts.length} מוצרים
            </button>
          )}
        </div>
      )}
    </>
  );
}
