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
  // The six Hebrew content hubs stay visible in the main desktop navigation:
  // catalog, categories, brands, bundles, recommendations and guides. Locale sections currently
  // expose four translated hubs, so their existing split remains unchanged.
  const primaryNav = dict.nav.slice(0, locale === "he" ? 6 : 4);
  const utilityNav = dict.nav.slice(locale === "he" ? 6 : 4);

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
              "header-shell overflow-hidden rounded-2xl border md:rounded-none lg:overflow-visible",
              atTop
                ? "border-line/60 bg-white/88 shadow-[0_10px_35px_-20px_rgba(10,22,36,0.28)] backdrop-blur-xl md:border-transparent md:bg-white/95 md:shadow-none"
                : "border-line/70 bg-white/92 shadow-[0_16px_45px_-24px_rgba(10,22,36,0.38)] backdrop-blur-2xl md:border-line/70 md:bg-white/96"
            )}
          >
            <div className="hidden border-b border-brand-gold/20 bg-[#fbfaf7] lg:block">
              <div className="container-page flex h-8 items-center justify-between text-[11px] text-graphite-soft/68">
                <div className="flex items-center gap-5">
                  <p className="flex items-center gap-2 font-semibold text-graphite">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden="true" />
                    {dict.header.trust[0]}
                  </p>
                  <span className="hidden xl:inline">{dict.header.trust[1]}</span>
                  <span className="hidden xl:inline">{dict.header.trust[2]}</span>
                </div>
                <div className="flex items-center gap-4">
                  {utilityNav.map((link) => (
                    <Link key={link.href} href={link.href} className="transition-colors hover:text-brand-blue">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={cx(
                "container-page flex items-center justify-between gap-2 transition-[height,padding] duration-300 md:h-[4.5rem] lg:gap-3 xl:gap-5",
                compact ? "h-12 py-1" : "h-14 py-0"
              )}
            >
              {/* Desktop */}
              <Logo compact={compact} className="hidden lg:flex" />

              <nav
                aria-label={dict.header.mainNavLabel}
                className="hidden items-center gap-0.5 rounded-full border border-line/60 bg-surface/55 p-1 lg:flex"
              >
                {primaryNav.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cx(
                        "rounded-full px-3 py-2 text-[13px] font-semibold transition-all xl:px-4 xl:text-sm",
                        isActive
                          ? "bg-white text-brand-blue shadow-sm ring-1 ring-line/60"
                          : "text-graphite-soft/82 hover:bg-white/70 hover:text-brand-blue"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden min-w-[12rem] max-w-[16rem] flex-1 lg:block xl:max-w-[19rem] 2xl:max-w-sm">
                <SearchBar
                  desktopLayout="wide"
                  placeholder={dict.header.searchPlaceholder}
                  fieldLabel={dict.header.searchFieldLabel}
                />
              </div>

              <div className="hidden items-center gap-1.5 border-s border-line/70 ps-3 lg:flex xl:gap-2">
                <LanguageSwitcher />
                <RequestBasketIcon />
                <div className="hidden xl:block">
                  <WhatsAppButton
                    message={buildWhatsAppGeneralMessage()}
                    label="ייעוץ בוואטסאפ"
                    trackAs="whatsapp_click_header"
                    size="sm"
                  />
                </div>
                <div className="xl:hidden">
                  <WhatsAppButton
                    message={buildWhatsAppGeneralMessage()}
                    label="ייעוץ בוואטסאפ"
                    trackAs="whatsapp_click_header"
                    iconOnly
                  />
                </div>
                <div className="hidden 2xl:block">
                  <PhoneButton phone={BUSINESS.phoneDisplay} label={BUSINESS.phoneDisplay} size="sm" />
                </div>
                <div className="2xl:hidden">
                  <PhoneButton phone={BUSINESS.phoneDisplay} label={BUSINESS.phoneDisplay} iconOnly />
                </div>
              </div>

              {/* Mobile — a calm brand-led bar with only the highest-value actions. */}
              <div className="flex w-full min-w-0 items-center justify-between gap-2 lg:hidden">
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={dict.header.openMenu}
                    aria-expanded={mobileOpen}
                    onClick={openMenu}
                    className={cx(
                      MOBILE_ICON_BTN,
                      "rounded-xl bg-brand-blue-light text-brand-blue hover:bg-brand-blue hover:text-white active:bg-brand-blue-dark"
                    )}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5.5 w-5.5 fill-none stroke-current stroke-[1.9]">
                      <path strokeLinecap="round" d="M4 7h16M4 12h11M4 17h16" />
                    </svg>
                  </button>
                  <Logo compact={compact} iconOnly />
                </div>

                <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  aria-label={dict.header.search}
                  aria-expanded={mobileSearchOpen}
                  onClick={openSearch}
                  className={cx(
                    MOBILE_ICON_BTN,
                    mobileSearchOpen
                      ? "bg-brand-blue text-white shadow-sm"
                      : "rounded-xl bg-surface/80 hover:bg-brand-blue-light hover:text-brand-blue active:bg-brand-blue-light"
                  )}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                    <circle cx="11" cy="11" r="7" />
                    <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                  <RequestBasketIcon className="rounded-xl hover:bg-brand-blue-light hover:text-brand-blue" />
                  <WhatsAppButton
                    message={buildWhatsAppGeneralMessage()}
                    trackAs="whatsapp_click_header"
                    variant="primary"
                    iconOnly
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </header>
        </div>

        <div className="header-spacer md:hidden" aria-hidden="true" />
      </div>

      <MobileNavDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} onSearch={openSearch} />
      <MobileSearchSheet open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
    </>
  );
}
