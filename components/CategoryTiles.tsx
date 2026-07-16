import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types/category";
import { Reveal } from "@/components/Reveal";
import { categoryImageFor } from "@/lib/categoryVisuals";

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
    <Reveal as="div" stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="tap-scale group relative min-h-56 overflow-hidden rounded-[1.6rem] bg-graphite text-white shadow-[0_20px_60px_-34px_rgba(10,20,34,0.55)] ring-1 ring-black/5 transition-all active:scale-[0.98] sm:min-h-64 sm:hover:-translate-y-1 sm:hover:shadow-[0_28px_70px_-34px_rgba(10,20,34,0.65)]"
        >
          <Image
            src={categoryImageFor(category.slug)}
            alt={`${category.name} לבית`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#09131f]/90 via-[#09131f]/10 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4 text-start sm:p-5">
            <span>
              <span className="block text-sm font-bold leading-tight sm:text-base">{category.name}</span>
              {title !== "compact" && (
                <span className="mt-1 block text-[11px] text-white/70 sm:text-xs">{category.productCount} מוצרים</span>
              )}
            </span>
            <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/14 text-lg backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-brand-blue">
              ←
            </span>
          </span>
        </Link>
      ))}
    </Reveal>
  );
}
