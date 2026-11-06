"use client";

import { useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { MobileSearchSheet } from "@/components/MobileSearchSheet";
import {
  BAR_PRIMARY_CLASS,
  BAR_PRIMARY_ICON_CLASS,
  BAR_SECONDARY_CLASS,
  BAR_SPACER_CLASS,
  BAR_TEXT_SIZE,
  BarIcon,
  BottomActionBarShell,
} from "@/components/BottomActionBar";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppGeneralMessage, buildWhatsAppUrl, telHref } from "@/lib/whatsapp/messages";
import { BUSINESS, cx } from "@/lib/utils";
import { shouldExcludePersistentCta } from "@/lib/conversion-intent";
import { getLocaleFromPathname, stripLocalePrefix, type Locale } from "@/lib/i18n/locales";

const BAR_TEXT: Record<
  Locale,
  {
    nav: string;
    search: string;
    call: string;
    whatsapp: string;
    pageMessage: (title: string, url: string) => string;
  }
> = {
  he: {
    nav: "פעולות מהירות",
    search: "חפש מוצר",
    call: "שיחה",
    whatsapp: "WhatsApp",
    pageMessage: (title, url) => `שלום, אני בעמוד "${title}" באתר ואשמח לעזרה בבחירת מוצר.\n${url}`,
  },
  en: {
    nav: "Quick actions",
    search: "Find a product",
    call: "Call",
    whatsapp: "WhatsApp",
    pageMessage: (title, url) => `Hello, I'm on the "${title}" page of your site and would like help choosing a product.\n${url}`,
  },
  ru: {
    nav: "Быстрые действия",
    search: "Найти товар",
    call: "Звонок",
    whatsapp: "WhatsApp",
    pageMessage: (title, url) => `Здравствуйте! Я на странице «${title}» вашего сайта, помогите, пожалуйста, с выбором.\n${url}`,
  },
};

/**
 * WhatsApp text that tells the store which page the shopper is reading, read
 * from the page's own <h1> at tap time (so it is always the current page,
 * even after client-side navigation). The home page keeps the general text.
 */
function pageAwareMessage(locale: Locale, basePath: string): string {
  if (basePath === "/") return buildWhatsAppGeneralMessage(locale);
  const title = document.querySelector("main h1, h1")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 90);
  if (!title) return buildWhatsAppGeneralMessage(locale);
  return BAR_TEXT[locale].pageMessage(title, `${window.location.origin}${window.location.pathname}`);
}

/**
 * Global mobile bottom bar: smart product search (primary), call, WhatsApp.
 * Hidden on Hebrew product pages (`ProductStickyCta` renders the same bar
 * with "add to request" as its primary) and on bundle pages, which have their
 * own "add the whole bundle" bar — so only one bottom bar is ever visible.
 */
export function StickyMobileCta() {
  const pathname = usePathname() ?? "/";
  const [searchOpen, setSearchOpen] = useState(false);
  const basePath = stripLocalePrefix(pathname);
  const locale = getLocaleFromPathname(pathname);
  const text = BAR_TEXT[locale];
  const size = BAR_TEXT_SIZE[locale];
  const isHebrewProductDetail = locale === "he" && /^\/products\/[^/]+/.test(basePath);
  const isBundleDetail = locale === "he" && /^\/bundles\/[^/]+/.test(basePath);

  if (isHebrewProductDetail || isBundleDetail || shouldExcludePersistentCta(pathname)) return null;

  function openSearch() {
    setSearchOpen(true);
    trackEvent("search_open", { placement: "bottom_bar", page: basePath });
  }

  function handleWhatsApp(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.href = buildWhatsAppUrl(pageAwareMessage(locale, basePath));
    trackEvent("whatsapp_click_header", { placement: "bottom_bar", page: basePath });
  }

  return (
    <>
      <div className={BAR_SPACER_CLASS} aria-hidden="true" />
      <BottomActionBarShell label={text.nav}>
        <button type="button" onClick={openSearch} aria-haspopup="dialog" className={cx(BAR_PRIMARY_CLASS, size.primary)}>
          <BarIcon name="search" className={cx("h-[1.35rem] w-[1.35rem]", BAR_PRIMARY_ICON_CLASS)} />
          <span className="truncate">{text.search}</span>
        </button>

        <a
          href={telHref(BUSINESS.phoneDisplay)}
          onClick={() => trackEvent("phone_click", { phone: BUSINESS.phoneDisplay, placement: "bottom_bar", page: basePath })}
          className={cx(BAR_SECONDARY_CLASS, size.secondary)}
        >
          <BarIcon name="phone" className="text-brand-blue" />
          {text.call}
        </a>

        <a
          href={buildWhatsAppUrl(buildWhatsAppGeneralMessage(locale))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsApp}
          className={cx(BAR_SECONDARY_CLASS, size.secondary)}
        >
          <BarIcon name="whatsapp" />
          {text.whatsapp}
        </a>
      </BottomActionBarShell>
      <MobileSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} placement="bottom_bar" />
    </>
  );
}
