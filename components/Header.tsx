"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RequestBasketIcon } from "@/components/RequestBasketIcon";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { SearchBar } from "@/components/SearchBar";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { MobileSearchSheet } from "@/components/MobileSearchSheet";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { NAV_LINKS } from "@/lib/nav";
import { BUSINESS, cx } from "@/lib/utils";
import { useScrollDirection } from "@/lib/useScrollDirection";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { direction, atTop } = useScrollDirection();
  const pathname = usePathname();

  const hidden = direction === "down" && !atTop && !mobileSearchOpen && !mobileOpen;
  const compact = !atTop && !hidden;

  function openMenu() {
    setMobileSearchOpen(false);
    setMobileOpen(true);
  }

  function openSearch() {
    setMobileOpen(false);
    setMobileSearchOpen(true);
  }

  return (
    <>
      <div className="header-anchor md:sticky md:top-0 md:z-50">
        <div
          className={cx(
            "header-float-wrap safe-top fixed inset-x-0 top-0 z-50 px-3 pt-2 md:static md:px-0 md:pt-0",
            hidden && "header-float-wrap--hidden"
          )}
        >
          <header
            data-compact={compact ? "true" : "false"}
            className={cx(
              "header-shell overflow-hidden rounded-2xl border md:rounded-none",
              atTop
                ? "border-line/60 bg-white/82 shadow-[0_4px_24px_-8px_rgba(16,21,28,0.12)] backdrop-blur-xl md:border-transparent md:bg-white/95 md:shadow-none"
                : "border-line/70 bg-white/88 shadow-[0_4px_28px_-6px_rgba(16,21,28,0.16)] backdrop-blur-2xl md:border-line md:bg-white/95"
            )}
          >
            <div
              className={cx(
                "container-page flex items-center justify-between gap-2 transition-[height,padding] duration-300 md:h-20 md:gap-3",
                compact ? "h-12 py-1" : "h-14 py-0"
              )}
            >
              <Logo compact={compact} />

              <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 lg:flex">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cx(
                        "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-surface-strong text-graphite" : "text-graphite hover:bg-surface"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden max-w-xs flex-1 md:block lg:max-w-sm">
                <SearchBar />
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-2">
                <LanguageSwitcher iconOnly className="md:hidden" />
                <LanguageSwitcher className="hidden md:block" />

                <button
                  type="button"
                  aria-label="חיפוש"
                  aria-expanded={mobileSearchOpen}
                  onClick={openSearch}
                  className={cx(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-graphite transition-colors sm:h-9 sm:w-9 md:hidden",
                    mobileSearchOpen ? "bg-brand-blue-light text-brand-blue" : "hover:bg-surface/80 active:bg-surface"
                  )}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8] sm:h-4.5 sm:w-4.5">
                    <circle cx="11" cy="11" r="7" />
                    <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                
                <PhoneButton phone={BUSINESS.phoneDisplay} className="lg:hidden" variant="ghost" iconOnly />
                <WhatsAppButton
                  message={buildWhatsAppGeneralMessage()}
                  trackAs="whatsapp_click_header"
                  className="lg:hidden"
                  variant="primary"
                  iconOnly
                />
                
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
                  onClick={openMenu}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-graphite transition-colors hover:bg-surface/80 active:bg-surface sm:h-9 sm:w-9 md:h-10 md:w-10 lg:hidden"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8] sm:h-4.5 sm:w-4.5 md:h-5 md:w-5">
                    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </header>
        </div>

        <div className="header-spacer md:hidden" aria-hidden="true" />
      </div>

      <MobileNavDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <MobileSearchSheet open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
    </>
  );
}
