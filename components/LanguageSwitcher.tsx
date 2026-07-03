"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const LANGUAGES = [
  { code: "he", label: "עברית", href: "/", enabled: true },
  { code: "en", label: "English", href: "/en", enabled: false },
  { code: "ru", label: "Русский", href: "/ru", enabled: false },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-graphite transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.6]">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z" />
        </svg>
        עברית
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[9rem] rounded-xl border border-line bg-white p-1 shadow-lg"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="none">
              {lang.enabled ? (
                <Link
                  role="menuitem"
                  href={lang.href}
                  className="block rounded-lg px-3 py-2 text-sm text-graphite hover:bg-surface"
                >
                  {lang.label}
                </Link>
              ) : (
                <span
                  role="menuitem"
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-graphite-soft/50"
                >
                  {lang.label}
                  <span className="text-[10px]">בקרוב</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
