"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomSheet } from "@/components/BottomSheet";
import { SearchBar } from "@/components/SearchBar";
import { trackEvent } from "@/lib/analytics";
import { getLocaleFromPathname, LOCALE_PREFIX, stripLocalePrefix, type Locale } from "@/lib/i18n/locales";
import { pageCategoryFromPath } from "@/lib/search/pageCategory";

const POPULAR_SEARCHES: Record<Locale, ReadonlyArray<{ label: string; href: string }>> = {
  he: [
    { label: "טלוויזיה 50 אינץ", href: "/products?category=tvs&q=50%20%D7%90%D7%99%D7%A0%D7%A5" },
    { label: "מכונת כביסה 10 ק״ג", href: "/products?category=washing-machines&q=10%20%D7%A7%D7%92" },
    { label: "מקרר 4 דלתות", href: "/products?category=refrigerators&q=4%20%D7%93%D7%9C%D7%AA%D7%95%D7%AA" },
    { label: "תנור בילט אין", href: "/products?category=ovens&q=%D7%91%D7%99%D7%9C%D7%98%20%D7%90%D7%99%D7%9F" },
  ],
  en: [
    { label: "Refrigerators", href: "/en/categories/refrigerators" },
    { label: "Washing machines", href: "/en/categories/washing-machines" },
    { label: "TVs", href: "/en/categories/tvs" },
    { label: "Ovens", href: "/en/categories/ovens" },
  ],
  ru: [
    { label: "Холодильники", href: "/ru/categories/refrigerators" },
    { label: "Стиральные машины", href: "/ru/categories/washing-machines" },
    { label: "Телевизоры", href: "/ru/categories/tvs" },
    { label: "Духовые шкафы", href: "/ru/categories/ovens" },
  ],
};

const SHEET_TEXT: Record<
  Locale,
  {
    title: string;
    placeholder: string;
    submit: string;
    popular: string;
    hint: string;
    contextHeading: string;
    contextPlaceholder: (label: string) => string;
    allInCategory: (label: string) => string;
  }
> = {
  he: {
    title: "מה מחפשים לבית?",
    placeholder: "למשל: טלוויזיה 50 אינץ, סמסונג, מקרר…",
    submit: "חיפוש",
    popular: "חיפושים שימושיים",
    hint: "אפשר לחפש גם עם שגיאת כתיב, שם מותג, דגם, גודל או קיבולת.",
    contextHeading: "ממשיכים מהעמוד הזה",
    contextPlaceholder: (label) => `חפשו ${label} לפי מותג, דגם או מידה…`,
    allInCategory: (label) => `כל ה${label} בקטלוג`,
  },
  en: {
    title: "What are you looking for?",
    placeholder: "e.g. 55-inch TV, Samsung, refrigerator…",
    submit: "Search",
    popular: "Popular categories",
    hint: "Search by brand, model number, size or capacity — typos are fine.",
    contextHeading: "Continue from this page",
    contextPlaceholder: (label) => `Search ${label.toLowerCase()} by brand, model or size…`,
    allInCategory: (label) => `All ${label.toLowerCase()} in the catalog`,
  },
  ru: {
    title: "Что ищете для дома?",
    placeholder: "Например: телевизор 55, Samsung, холодильник…",
    submit: "Найти",
    popular: "Популярные категории",
    hint: "Ищите по бренду, модели, размеру или объёму — опечатки не страшны.",
    contextHeading: "Продолжить с этой страницы",
    contextPlaceholder: (label) => `${label}: бренд, модель или размер…`,
    allInCategory: (label) => `${label} — весь каталог`,
  },
};

export function MobileSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() ?? "/";
  const locale = getLocaleFromPathname(pathname);
  const text = SHEET_TEXT[locale];
  const basePath = stripLocalePrefix(pathname);
  const pageCategory = pageCategoryFromPath(basePath, locale);
  // On the category page itself, "all of this category" is the page they are on.
  const showCategoryShortcut = pageCategory && !basePath.startsWith("/categories/");
  const categoryHref = pageCategory ? `${LOCALE_PREFIX[locale]}/categories/${pageCategory.slug}` : "";

  return (
    <BottomSheet open={open} onClose={onClose} placement="search" title={text.title}>
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-8 pt-4 sm:px-6">
        <SearchBar
          autoFocus={open}
          size="lg"
          submitLabel={text.submit}
          dropdownMode="inline"
          placeholder={pageCategory ? text.contextPlaceholder(pageCategory.label) : text.placeholder}
          onNavigate={onClose}
        />

        {showCategoryShortcut && (
          <Link
            href={categoryHref}
            onClick={() => {
              trackEvent("search_shortcut_click", { category: pageCategory.slug, from: basePath });
              onClose();
            }}
            className="tap-target mt-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-blue/15 bg-brand-blue-light px-4 py-3.5 text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
          >
            <span className="flex flex-col">
              <span className="text-[11px] font-bold opacity-75">{text.contextHeading}</span>
              <span className="text-[15px] font-extrabold">{text.allInCategory(pageCategory.label)}</span>
            </span>
            <span aria-hidden="true" className="text-lg rtl:rotate-180">→</span>
          </Link>
        )}

        <div className="mt-6 rounded-[1.6rem] border border-line/80 bg-white p-4 shadow-[0_20px_45px_-38px_rgba(7,57,96,0.7)]">
          <p className="text-sm font-extrabold text-graphite">{text.popular}</p>
          <p className="mt-1 text-xs leading-5 text-graphite-soft/65">{text.hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_SEARCHES[locale].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="tap-target inline-flex items-center rounded-full border border-brand-blue/15 bg-brand-blue-light px-3.5 py-2 text-sm font-bold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
