"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { cx } from "@/lib/utils";
import type { CategorySuggestionItem } from "@/components/CategorySuggestions";

interface Suggestion {
  name: string;
  slug: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
}

export function SearchBar({
  size = "md",
  autoFocus = false,
  placeholder = "חפשו מקרר, מכונת כביסה, מותג, מק״ט או קטגוריה…",
  onNavigate,
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitIndex = categorySuggestions.length + suggestions.length;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        setCategorySuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        if (!res.ok) return;
        const json = await res.json();
        setSuggestions(json.results ?? []);
        setCategorySuggestions(json.categories ?? []);
        setOpen(true);
      } catch {
        // Search suggestions are a progressive enhancement; fail silently.
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
      } else if (activeIndex >= categorySuggestions.length && activeIndex < submitIndex) {
        const product = suggestions[activeIndex - categorySuggestions.length];
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
  const showDropdown = open && (suggestions.length > 0 || categorySuggestions.length > 0 || value.trim().length >= 2);

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(value);
        }}
        className="relative"
      >
        <label htmlFor="site-search" className="sr-only">
          חיפוש מוצרים
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-graphite-soft/60 stroke-2"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="site-search"
          type="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => (suggestions.length > 0 || categorySuggestions.length > 0 || value.trim().length >= 2) && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          className={`w-full rounded-full border border-line bg-white pe-12 ps-4 text-graphite shadow-sm outline-none placeholder:text-graphite-soft/50 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${sizeClasses}`}
        />
      </form>

      {showDropdown && (
        <div className="absolute z-40 mt-2 max-h-[min(70vh,420px)] w-full overflow-y-auto rounded-3xl border border-line bg-white shadow-xl">
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

          {suggestions.length > 0 && (
            <ul id="search-suggestions" role="listbox">
              {suggestions.map((s, index) => {
                const idx = categorySuggestions.length + index;
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
                <Image
                  src={s.imageUrl || "/images/product-placeholder.svg"}
                  alt=""
                  fill
                  sizes="40px"
                  className={cx("object-contain p-1", !s.imageUrl && "opacity-40")}
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
