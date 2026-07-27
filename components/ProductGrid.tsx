"use client";

import { useCallback, useState } from "react";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { prioritizeProductsWithImages } from "@/lib/search/productSorting";

export function ProductGrid({
  products,
  emptyMessage = "לא נמצאו מוצרים התואמים את החיפוש.",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  const [failedProductImages, setFailedProductImages] = useState<Set<string>>(() => new Set());

  const handleImageError = useCallback((modelNumber: string) => {
    setFailedProductImages((current) => {
      if (current.has(modelNumber)) return current;
      const next = new Set(current);
      next.add(modelNumber);
      return next;
    });
  }, []);

  if (products.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-line bg-surface px-5 py-10 text-center md:px-6 md:py-16">
        <p className="text-sm text-graphite-soft/80 md:text-base">{emptyMessage}</p>
      </div>
    );
  }

  const orderedProducts = prioritizeProductsWithImages(products).sort(
    (a, b) => Number(failedProductImages.has(a.modelNumber)) - Number(failedProductImages.has(b.modelNumber))
  );

  return (
    <Reveal as="div" stagger className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {orderedProducts.map((product, index) => (
        <div
          key={product.modelNumber}
          className="card-enter h-full"
          style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
        >
          <ProductCard product={product} onImageError={handleImageError} />
        </div>
      ))}
    </Reveal>
  );
}
