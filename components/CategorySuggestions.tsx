import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";

export interface CategorySuggestionItem {
  name: string;
  slug: string;
  productCount?: number;
}

/**
 * Renders "קטגוריות שמתאימות לחיפוש שלך" — used both inside the SearchBar's
 * live dropdown (compact chip rail) and above product search results on
 * /products (larger panel). Pure presentational, no client-only APIs, so it
 * can be rendered from Server Components too.
 */
export function CategorySuggestions({
  categories,
  variant = "panel",
  onNavigate,
}: {
  categories: CategorySuggestionItem[];
  variant?: "panel" | "dropdown";
  onNavigate?: () => void;
}) {
  if (categories.length === 0) return null;

  if (variant === "dropdown") {
    return (
      <div className="border-b border-line px-3 py-3">
        <p className="px-1.5 pb-2 text-xs font-semibold text-graphite-soft/60">קטגוריות שמתאימות לחיפוש שלך</p>
        <div className="scroll-x-fade flex gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              onClick={onNavigate}
              className="tap-target inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-blue-light px-3.5 py-2 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
            >
              <CategoryIcon name={category.name} className="h-4 w-4" />
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="category-suggestions-heading"
      className="mb-5 rounded-2xl border border-brand-blue/15 bg-brand-blue-light/40 p-4 md:p-5"
    >
      <h2 id="category-suggestions-heading" className="mb-3 text-sm font-bold text-graphite md:text-base">
        קטגוריות שמתאימות לחיפוש שלך
      </h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="tap-target inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-white px-4 py-2 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
          >
            <CategoryIcon name={category.name} className="h-4 w-4 text-brand-blue" />
            {category.name}
            {typeof category.productCount === "number" && (
              <span className="text-xs text-graphite-soft/50">({category.productCount})</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
