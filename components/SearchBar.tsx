"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

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
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        if (!res.ok) return;
        const json = await res.json();
        setSuggestions(json.results ?? []);
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

  function submitSearch(query: string) {
    const trimmed = query.trim();
    trackEvent("search_query", { query: trimmed });
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitSearch(value);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        router.push(`/products/${encodeURIComponent(suggestions[activeIndex].slug)}`);
        setOpen(false);
      } else {
        submitSearch(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const sizeClasses = size === "lg" ? "py-4 text-base md:py-5 md:text-lg" : "py-2.5 text-sm";

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
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          className={`w-full rounded-full border border-line bg-white pe-12 ps-4 text-graphite shadow-sm outline-none placeholder:text-graphite-soft/50 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${sizeClasses}`}
        />
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
        >
          {suggestions.map((s, index) => (
            <li key={s.slug} role="option" aria-selected={index === activeIndex}>
              <Link
                href={`/products/${encodeURIComponent(s.slug)}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface ${
                  index === activeIndex ? "bg-surface" : ""
                }`}
              >
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface">
                  <Image
                    src={s.imageUrl || "/images/product-placeholder.svg"}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-contain p-1"
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
          ))}
          <li>
            <button
              type="button"
              onClick={() => submitSearch(value)}
              className="block w-full px-4 py-3 text-start text-sm font-semibold text-brand-blue hover:bg-surface"
            >
              הצג את כל התוצאות עבור &quot;{value}&quot;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
