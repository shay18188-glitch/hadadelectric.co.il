import type { Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";

export function ProductGrid({
  products,
  emptyMessage = "לא נמצאו מוצרים התואמים את החיפוש.",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-line bg-surface px-5 py-10 text-center md:px-6 md:py-16">
        <p className="text-sm text-graphite-soft/80 md:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Reveal as="div" stagger className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <div
          key={product.modelNumber}
          className="card-enter h-full"
          style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </Reveal>
  );
}
