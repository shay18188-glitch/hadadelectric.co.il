"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { cx } from "@/lib/utils";
import type { CategorySuggestionItem } from "@/components/CategorySuggestions";
import { ProductImage } from "@/components/ProductImage";
import type { QuickSearchFilter } from "@/lib/search/quickFilters";
import { normalizeHebrewSearch } from "@/lib/search/normalizeHebrew";

interface Suggestion {
  name: string;
  slug: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
}

interface BrandSuggestion {
  name: string;
  slug: string;
  productCount: number;
}

interface SearchPayload {
  results: Suggestion[];
  categories: CategorySuggestionItem[];
  brands: BrandSuggestion[];
  quickFilters: QuickSearchFilter[];
}

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const searchResultCache = new Map<string, { data: SearchPayload; expiresAt: number }>();

export function SearchBar({
  size = "md",
  autoFocus = false,
  placeholder = "חפשו מקרר, מכונת כביסה, מותג, מק״ט או קטגוריה…",
  fieldLabel = "חיפוש מוצרים",
  submitLabel,
  className,
  onNavigate,
  dropdownMode = "floating",
  desktopLayout = "single",
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
  /** Screen-reader label for the input; localized by the header. */
  fieldLabel?: string;
  submitLabel?: string;
  className?: string;
  onNavigate?: () => void;
  dropdownMode?: "floating" | "inline";
  desktopLayout?: "single" | "wide";
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestionItem[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<BrandSuggestion[]>([]);
  const [quickFilters, setQuickFilters] = useState<QuickSearchFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputId = useId();
  const suggestionsId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productStartIndex = categorySuggestions.length + brandSuggestions.length;
  const submitIndex = productStartIndex + suggestions.length;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const controller = new AbortController();

    const query = value.trim();
    if (query.length < 2) {
      return () => controller.abort();
    }

    const cacheKey = normalizeHebrewSearch(query);
    const cached = searchResultCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return () => controller.abort();
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(cacheKey)}`, {
          signal: controller.signal,
          cache: "force-cache",
        });
        if (!res.ok) return;
        const json = await res.json() as Partial<SearchPayload>;
        const data: SearchPayload = {
          results: json.results ?? [],
          categories: json.categories ?? [],
          brands: json.brands ?? [],
          quickFilters: json.quickFilters ?? [],
        };
        if (searchResultCache.size >= 80) {
          searchResultCache.delete(searchResultCache.keys().next().value ?? "");
        }
        searchResultCache.set(cacheKey, { data, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });
        setSuggestions(data.results);
        setCategorySuggestions(data.categories);
        setBrandSuggestions(data.brands);
        setQuickFilters(data.quickFilters);
        setOpen(true);
      } catch {
        // Search suggestions are a progressive enhancement; fail silently.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 120);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function closeAndNavigate() {
    setOpen(false);
    onNavigate?.();
  }

  function handleValueChange(nextValue: string) {
    setValue(nextValue);
    setActiveIndex(-1);

    const query = nextValue.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setCategorySuggestions([]);
      setBrandSuggestions([]);
      setQuickFilters([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    const cached = searchResultCache.get(normalizeHebrewSearch(query));
    if (cached && cached.expiresAt > Date.now()) {
      setSuggestions(cached.data.results);
      setCategorySuggestions(cached.data.categories);
      setBrandSuggestions(cached.data.brands);
      setQuickFilters(cached.data.quickFilters);
      setLoading(false);
      setOpen(true);
      return;
    }

    // Do not leave results from the previous query visible while a new query
    // is running. This also makes the UI feel immediate on slower networks.
    setSuggestions([]);
    setCategorySuggestions([]);
    setBrandSuggestions([]);
    setQuickFilters([]);
    setLoading(true);
    setOpen(true);
  }

  function submitSearch(query: string) {
    const trimmed = query.trim();
    trackEvent("search_query", { query: trimmed });
    setOpen(false);
    onNavigate?.();
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const navigableCount = submitIndex + (value.trim().length >= 2 ? 1 : 0);

    if (e.key === "ArrowDown") {
      if (navigableCount > 0 && open) {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, navigableCount - 1));
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (navigableCount > 0 && open) {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < categorySuggestions.length) {
        router.push(`/categories/${encodeURIComponent(categorySuggestions[activeIndex].slug)}`);
        closeAndNavigate();
      } else if (activeIndex >= categorySuggestions.length && activeIndex < productStartIndex) {
        const brand = brandSuggestions[activeIndex - categorySuggestions.length];
        router.push(`/brands/${encodeURIComponent(brand.slug)}`);
        closeAndNavigate();
      } else if (activeIndex >= productStartIndex && activeIndex < submitIndex) {
        const product = suggestions[activeIndex - productStartIndex];
        router.push(`/products/${encodeURIComponent(product.slug)}`);
        closeAndNavigate();
      } else {
        submitSearch(value);
      }
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const sizeClasses = size === "lg" ? "py-3.5 text-base md:py-5 md:text-lg" : "py-2.5 text-sm md:py-2.5";
  const showDropdown = open && (
    loading || suggestions.length > 0 || categorySuggestions.length > 0 || brandSuggestions.length > 0 || value.trim().length >= 2
  );

  return (
    <div ref={containerRef} className={cx("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(value);
        }}
        className="relative"
      >
        <label htmlFor={inputId} className="sr-only">
          {fieldLabel}
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-graphite-soft/60 stroke-2"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={inputId}
          type="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={suggestionsId}
          aria-autocomplete="list"
          enterKeyHint="search"
          autoComplete="off"
          className={cx(
            "w-full rounded-full border border-line bg-white ps-12 text-graphite shadow-sm outline-none placeholder:text-graphite-soft/50 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20",
            submitLabel ? "pe-[6.4rem]" : "pe-4",
            sizeClasses
          )}
        />
        {submitLabel && (
          <button
            type="submit"
            className="tap-target absolute inset-y-1.5 end-1.5 inline-flex min-w-[5.5rem] items-center justify-center rounded-full bg-brand-blue px-4 text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(11,87,147,0.9)] transition-colors hover:bg-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {submitLabel}
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          id={suggestionsId}
          className={cx(
            "z-[80] mt-2 w-full overflow-y-auto overscroll-contain rounded-3xl border border-line bg-white shadow-[0_28px_80px_-28px_rgba(7,26,44,0.45)] [scrollbar-gutter:stable]",
            dropdownMode === "floating"
              ? "absolute end-0 max-h-[min(68dvh,36rem)]"
              : "relative max-h-none overscroll-contain shadow-[0_18px_45px_-28px_rgba(7,57,96,0.4)]",
            dropdownMode === "floating" &&
              desktopLayout === "wide" &&
              "lg:w-[min(42rem,calc(100vw-2rem))]"
          )}
          aria-busy={loading}
        >
          {loading && suggestions.length === 0 && categorySuggestions.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-5 text-sm text-graphite-soft/70" role="status">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-blue/25 border-t-brand-blue" aria-hidden="true" />
              מחפש מוצרים והתאמות…
            </div>
          )}
          {categorySuggestions.length > 0 && (
            <div className="border-b border-line px-3 py-3">
              <p className="px-1.5 pb-2 text-xs font-semibold text-graphite-soft/60">קטגוריות שמתאימות לחיפוש שלך</p>
              <div className="scroll-x-fade flex gap-2 md:flex-wrap">
                {categorySuggestions.map((category, index) => (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    onClick={closeAndNavigate}
                    className={`tap-target inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                      activeIndex === index
                        ? "bg-brand-blue text-white"
                        : "bg-brand-blue-light text-brand-blue hover:bg-brand-blue hover:text-white"
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {quickFilters.length > 0 && (
            <div className="border-b border-line px-3 py-3">
              <p className="px-1.5 pb-2 text-xs font-semibold text-graphite-soft/60">התאמות חכמות לפי המאפיינים שחיפשת</p>
              <div className="scroll-x-fade flex gap-2">
                {quickFilters.map((filter) => (
                  <Link
                    key={`${filter.categorySlug}-${filter.query}`}
                    href={`/products?category=${encodeURIComponent(filter.categorySlug)}&q=${encodeURIComponent(filter.query)}`}
                    onClick={closeAndNavigate}
                    className="tap-target inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-gold/30 bg-[#fffaf0] px-3.5 py-2 text-sm font-bold text-graphite transition-colors hover:border-brand-gold hover:bg-brand-gold/12"
                  >
                    {filter.label}
                    <span className="text-xs font-medium text-graphite-soft/55">({filter.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {brandSuggestions.length > 0 && (
            <div className="border-b border-line px-3 py-3">
              <p className="px-1.5 pb-2 text-xs font-semibold text-graphite-soft/60">מותגים</p>
              <div className="scroll-x-fade flex gap-2 md:flex-wrap">
                {brandSuggestions.map((brand, index) => {
                  const idx = categorySuggestions.length + index;
                  return (
                    <Link
                      key={brand.slug}
                      href={`/brands/${brand.slug}`}
                      onClick={closeAndNavigate}
                      className={cx(
                        "tap-target inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-bold transition-colors",
                        activeIndex === idx
                          ? "border-brand-blue bg-brand-blue text-white"
                          : "border-line bg-white text-graphite hover:border-brand-blue/30 hover:text-brand-blue"
                      )}
                    >
                      {brand.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label="מוצרים"
              className={cx(desktopLayout === "wide" && "lg:grid lg:grid-cols-2")}
            >
              {suggestions.map((s, index) => {
                const idx = productStartIndex + index;
                return (
                  <li key={s.slug} role="option" aria-selected={idx === activeIndex}>
                    <Link
                      href={`/products/${encodeURIComponent(s.slug)}`}
                      onClick={closeAndNavigate}
                      className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface ${
                        idx === activeIndex ? "bg-surface" : ""
                      }`}
                    >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-surface">
                <ProductImage
                  src={s.imageUrl || "/images/product-placeholder-v2.webp"}
                  alt=""
                  fill
                  sizes="40px"
                  className={cx("object-contain", s.imageUrl ? "p-1" : "opacity-95")}
                />
              </span>
                      <span className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium text-graphite">{s.name}</span>
                        <span className="truncate text-xs text-graphite-soft/70">
                          {[s.brand, s.category].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {value.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => submitSearch(value)}
              className={`tap-target block w-full px-4 py-3.5 text-start text-sm font-semibold text-brand-blue hover:bg-surface ${
                activeIndex === submitIndex ? "bg-surface" : ""
              }`}
            >
              הצג את כל התוצאות עבור &quot;{value}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
