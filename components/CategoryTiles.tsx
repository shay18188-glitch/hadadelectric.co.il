import Link from "next/link";
import type { Category } from "@/types/category";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Reveal } from "@/components/Reveal";

export function CategoryTiles({
  categories,
  title,
  emptyMessage,
}: {
  categories: Category[];
  title?: string;
  emptyMessage?: string;
}) {
  if (categories.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
        <p className="text-sm text-graphite-soft/80">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Reveal as="div" stagger className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="tap-scale group flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-white p-4 text-center transition-all active:scale-[0.97] sm:gap-3 sm:p-5 sm:hover:-translate-y-0.5 sm:hover:border-brand-blue/30 sm:hover:shadow-md"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white sm:h-14 sm:w-14">
            <CategoryIcon name={category.name} className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <span className="text-[13px] font-semibold leading-tight text-graphite sm:text-sm">{category.name}</span>
          {title !== "compact" && (
            <span className="text-[11px] text-graphite-soft/60 sm:text-xs">{category.productCount} מוצרים</span>
          )}
        </Link>
      ))}
    </Reveal>
  );
}
