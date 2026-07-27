"use client";

import Link from "next/link";
import { BottomSheet } from "@/components/BottomSheet";
import { SearchBar } from "@/components/SearchBar";

const POPULAR_SEARCHES = [
  { label: "טלוויזיה 50 אינץ", href: "/products?category=tvs&q=50%20%D7%90%D7%99%D7%A0%D7%A5" },
  { label: "מכונת כביסה 10 ק״ג", href: "/products?category=washing-machines&q=10%20%D7%A7%D7%92" },
  { label: "מקרר 4 דלתות", href: "/products?category=refrigerators&q=4%20%D7%93%D7%9C%D7%AA%D7%95%D7%AA" },
  { label: "תנור בילט אין", href: "/products?category=ovens&q=%D7%91%D7%99%D7%9C%D7%98%20%D7%90%D7%99%D7%9F" },
] as const;

export function MobileSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} placement="search" title="מה מחפשים לבית?">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-8 pt-4 sm:px-6">
        <SearchBar
          autoFocus={open}
          size="lg"
          submitLabel="חיפוש"
          dropdownMode="inline"
          placeholder="למשל: טלוויזיה 50 אינץ, סמסונג, מקרר…"
          onNavigate={onClose}
        />

        <div className="mt-6 rounded-[1.6rem] border border-line/80 bg-white p-4 shadow-[0_20px_45px_-38px_rgba(7,57,96,0.7)]">
          <p className="text-sm font-extrabold text-graphite">חיפושים שימושיים</p>
          <p className="mt-1 text-xs leading-5 text-graphite-soft/65">אפשר לחפש גם עם שגיאת כתיב, שם מותג, דגם, גודל או קיבולת.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((item) => (
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
