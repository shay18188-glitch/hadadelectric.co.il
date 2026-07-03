"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppUrl, buildWhatsAppProductMessage } from "@/lib/whatsapp/messages";

export function ProductCard({ product }: { product: Product }) {
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

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-md">
      <Link
        href={`/products/${encodeURIComponent(product.slug)}`}
        className="relative block aspect-square overflow-hidden bg-surface"
        onClick={() => trackEvent("product_view", { model_number: product.modelNumber })}
      >
        <Image
          src={product.imageUrl || "/images/product-placeholder.svg"}
          alt={`${product.name} - חדד יובל אלקטריק בע״מ`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
        <AvailabilityBadge availability={product.availability} className="absolute right-3 top-3" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand && <p className="text-xs font-medium text-brand-blue">{product.brand}</p>}
        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="focus-visible:outline-none">
          <h3 className="line-clamp-2 text-sm font-semibold text-graphite hover:underline md:text-base">
            {product.name}
          </h3>
        </Link>
        {product.category && <p className="text-xs text-graphite-soft/70">{product.category}</p>}

        <div className="mt-auto flex flex-col gap-2 pt-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleToggleBasket}
              aria-pressed={inBasket}
              className="flex-1 rounded-full border border-line px-3 py-2 text-xs font-semibold text-graphite transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
            >
              {inBasket ? "הוסר מהבקשה ✓" : "הוסף לבקשה"}
            </button>
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="flex-1 rounded-full bg-graphite px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-graphite-soft"
            >
              לפרטים
            </Link>
          </div>
          <a
            href={buildWhatsAppUrl(buildWhatsAppProductMessage(product))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("whatsapp_click_product", { model_number: product.modelNumber })}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-[#128C4A] transition-colors hover:bg-[#25D366]/20"
          >
            הזמן בוואטסאפ
          </a>
        </div>
      </div>
    </div>
  );
}
