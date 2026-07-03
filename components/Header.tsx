"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RequestBasketIcon } from "@/components/RequestBasketIcon";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { SearchBar } from "@/components/SearchBar";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "קטלוג" },
  { href: "/categories", label: "קטגוריות" },
  { href: "/brands", label: "מותגים" },
  { href: "/guides", label: "מדריכים" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Logo />

        <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-graphite transition-colors hover:bg-surface"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden max-w-xs flex-1 md:block lg:max-w-sm">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <LanguageSwitcher className="hidden md:block" />
          <button
            type="button"
            aria-label="חיפוש"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-graphite hover:bg-surface md:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <RequestBasketIcon />
          <WhatsAppButton
            message={buildWhatsAppGeneralMessage()}
            trackAs="whatsapp_click_header"
            className="hidden lg:inline-flex"
            size="sm"
          />
          <PhoneButton phone={BUSINESS.phoneDisplay} className="hidden lg:inline-flex" size="sm" />
          <button
            type="button"
            aria-label="פתח תפריט"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-graphite hover:bg-surface lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          <SearchBar autoFocus />
        </div>
      )}

      {mobileOpen && (
        <nav aria-label="ניווט נייד" className="border-t border-line bg-white px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-graphite hover:bg-surface"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <LanguageSwitcher />
            <div className="flex gap-2">
              <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" size="sm" />
              <PhoneButton phone={BUSINESS.phoneDisplay} size="sm" />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
