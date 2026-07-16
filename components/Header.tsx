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
import { getLocaleFromPathname } from "@/lib/i18n/locales";
import { CHROME } from "@/lib/i18n/chrome";
import { BUSINESS, cx } from "@/lib/utils";
import { useScrollDirection } from "@/lib/useScrollDirection";

const MOBILE_ICON_BTN =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-graphite transition-colors";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { direction, atTop } = useScrollDirection();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const dict = CHROME[locale];

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
            "header-float-wrap safe-top fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-3 md:static md:px-0 md:pt-0",
            hidden && "header-float-wrap--hidden"
          )}
        >
          <header
            data-compact={compact ? "true" : "false"}
            className={cx(
              "header-shell overflow-hidden rounded-2xl border md:rounded-none",
              atTop
                ? "border-line/60 bg-white/88 shadow-[0_10px_35px_-20px_rgba(10,22,36,0.28)] backdrop-blur-xl md:border-transparent md:bg-white/95 md:shadow-none"
                : "border-line/70 bg-white/92 shadow-[0_16px_45px_-24px_rgba(10,22,36,0.38)] backdrop-blur-2xl md:border-line/70 md:bg-white/96"
            )}
          >
            <div className="hidden bg-graphite text-white md:block">
              <div className="container-page flex h-8 items-center justify-between text-[11px]">
                <p className="font-medium">משלוחים והתקנה בכל אזור הצפון</p>
                <div className="flex items-center gap-5 text-white/70">
                  <span>ייעוץ אישי מחנות פיזית בנהריה</span>
                  <span>יבואנים רשמיים</span>
                </div>
              </div>
            </div>
            <div
              className={cx(
                "container-page flex items-center justify-between gap-2 transition-[height,padding] duration-300 md:h-[4.75rem] md:gap-4",
                compact ? "h-12 py-1" : "h-14 py-0"
              )}
            >
              {/* Desktop */}
              <Logo compact={compact} className="hidden lg:flex" />

              <nav aria-label={dict.header.mainNavLabel} className="hidden items-center gap-0.5 lg:flex">
                {dict.nav.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cx(
                        "relative px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-brand-blue after:transition-transform",
                        isActive
                          ? "text-brand-blue after:scale-x-100"
                          : "text-graphite-soft/85 hover:text-brand-blue hover:after:scale-x-100"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden max-w-xs flex-1 md:block lg:max-w-[19rem] xl:max-w-sm">
                <SearchBar />
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <LanguageSwitcher />
                <RequestBasketIcon />
                <WhatsAppButton
                  message={buildWhatsAppGeneralMessage()}
                  label="ייעוץ בוואטסאפ"
                  trackAs="whatsapp_click_header"
                  size="sm"
                />
                <PhoneButton phone={BUSINESS.phoneDisplay} label={BUSINESS.phoneDisplay} size="sm" />
              </div>

              {/* Mobile — actions on the right (RTL start), logo + menu on the left (RTL end) */}
              <div className="flex min-w-0 flex-1 items-center gap-0.5 sm:gap-1 lg:hidden">
                <LanguageSwitcher iconOnly />
                <button
                  type="button"
                  aria-label={dict.header.search}
                  aria-expanded={mobileSearchOpen}
                  onClick={openSearch}
                  className={cx(
                    MOBILE_ICON_BTN,
                    mobileSearchOpen ? "bg-brand-blue-light text-brand-blue" : "hover:bg-surface/80 active:bg-surface"
                  )}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                    <circle cx="11" cy="11" r="7" />
                    <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                <PhoneButton phone={BUSINESS.phoneDisplay} variant="ghost" iconOnly />
                <WhatsAppButton
                  message={buildWhatsAppGeneralMessage()}
                  trackAs="whatsapp_click_header"
                  variant="primary"
                  iconOnly
                />
                <RequestBasketIcon />
              </div>

              <div className="flex shrink-0 items-center gap-1 lg:hidden">
                <Logo compact={compact} iconOnly />
                <button
                  type="button"
                  aria-label={dict.header.openMenu}
                  aria-expanded={mobileOpen}
                  onClick={openMenu}
                  className={cx(MOBILE_ICON_BTN, "hover:bg-surface/80 active:bg-surface")}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
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
