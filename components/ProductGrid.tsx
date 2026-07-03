import type { Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";

export function ProductGrid({
  products,
  emptyMessage = "לא נמצאו מוצרים התואמים את החיפוש.",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <p className="text-graphite-soft/80">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.modelNumber} product={product} />
      ))}
    </div>
  );
}
