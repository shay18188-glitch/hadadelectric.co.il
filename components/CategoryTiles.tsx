import Link from "next/link";
import type { Category } from "@/types/category";
import { CategoryIcon } from "@/components/CategoryIcon";

export function CategoryTiles({ categories, title }: { categories: Category[]; title?: string }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-md"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
            <CategoryIcon name={category.name} className="h-7 w-7" />
          </span>
          <span className="text-sm font-semibold text-graphite">{category.name}</span>
          {title !== "compact" && (
            <span className="text-xs text-graphite-soft/60">{category.productCount} מוצרים</span>
          )}
        </Link>
      ))}
    </div>
  );
}
