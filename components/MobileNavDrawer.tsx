"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomSheet } from "@/components/BottomSheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { getLocaleFromPathname } from "@/lib/i18n/locales";
import { CHROME } from "@/lib/i18n/chrome";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS, cx } from "@/lib/utils";

const MENU_COPY = {
  he: {
    title: "חדד יובל אלקטריק",
    kicker: "חנות מוצרי חשמל בנהריה",
    intro: "כל מה שצריך לבית — עם ייעוץ אישי, משלוח והתקנה בכל אזור הצפון.",
    search: "חפשו מוצר, מותג או דגם…",
    searchButton: "חיפוש",
    main: "קנייה ותוכן",
    more: "מידע ושירות",
    request: "הבקשה שלי",
    requestHint: "המוצרים ששמרתם",
    help: "צריכים עזרה בבחירה?",
    helpHint: "צוות החנות זמין לייעוץ אישי",
    call: "התקשרו",
    whatsapp: "וואטסאפ",
  },
  en: {
    title: "Hadad Electric",
    kicker: "Home appliances in Nahariya",
    intro: "Everything for your home, with personal advice and delivery across northern Israel.",
    search: "Search products or brands…",
    searchButton: "Search",
    main: "Shop & explore",
    more: "Information & service",
    request: "My request",
    requestHint: "Your saved products",
    help: "Need help choosing?",
    helpHint: "Our store team is here to help",
    call: "Call us",
    whatsapp: "WhatsApp",
  },
  ru: {
    title: "Hadad Electric",
    kicker: "Бытовая техника в Нагарии",
    intro: "Всё для дома, персональная консультация и доставка по северу Израиля.",
    search: "Поиск товаров и брендов…",
    searchButton: "Поиск",
    main: "Каталог и материалы",
    more: "Информация и сервис",
    request: "Моя заявка",
    requestHint: "Сохранённые товары",
    help: "Нужна помощь?",
    helpHint: "Команда магазина готова помочь",
    call: "Позвонить",
    whatsapp: "WhatsApp",
  },
} as const;

export function MobileNavDrawer({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const dict = CHROME[locale];
  const copy = MENU_COPY[locale];
  const primaryCount = locale === "he" ? 6 : 4;
  const primaryLinks = dict.nav.slice(0, primaryCount);
  const utilityLinks = dict.nav.slice(primaryCount);

  return (
    <BottomSheet open={open} onClose={onClose} placement="end" title={copy.title}>
      <div className="flex min-h-full flex-col">
        <div className="px-4 pb-3 pt-4">
          <div className="blueprint-grid relative overflow-hidden rounded-[1.75rem] bg-brand-blue-dark px-5 py-5 text-white shadow-[0_24px_50px_-32px_rgba(7,57,96,0.95)]">
            <span className="absolute -left-10 -top-16 h-36 w-36 rounded-full bg-brand-blue/55 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <p className="text-[11px] font-black tracking-[0.11em] text-brand-gold">{copy.kicker}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-white/78">{copy.intro}</p>
            </div>
          </div>

          {locale === "he" && (
            <div className="relative z-20 -mt-2 px-2">
              <button
                type="button"
                onClick={onSearch}
                className="tap-target flex w-full items-center gap-3 rounded-full border border-line bg-white px-4 py-3.5 text-start text-sm font-semibold text-graphite-soft shadow-[0_18px_35px_-24px_rgba(7,57,96,0.8)] transition-colors hover:border-brand-blue/30 hover:text-brand-blue"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-brand-blue stroke-2">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                </svg>
                <span className="flex-1">{copy.search}</span>
                <span className="rounded-full bg-brand-blue-light px-3 py-1.5 text-xs font-extrabold text-brand-blue">{copy.searchButton}</span>
              </button>
            </div>
          )}
        </div>

        <nav aria-label={dict.header.mainNavLabel} className="px-4 pb-4">
          <p className="mb-2.5 px-1 text-xs font-black tracking-[0.08em] text-graphite-soft/58">{copy.main}</p>
          <ul className="grid grid-cols-2 gap-2.5">
            {primaryLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={cx(
                    "tap-target group flex min-h-24 flex-col items-start justify-between rounded-[1.4rem] border px-3.5 py-3.5 text-[15px] font-bold shadow-[0_15px_35px_-30px_rgba(10,22,36,0.65)] transition-all",
                    isActive
                      ? "border-brand-blue bg-brand-blue text-white"
                      : "border-line/80 bg-white text-graphite hover:-translate-y-0.5 hover:border-brand-blue/25 hover:text-brand-blue active:bg-brand-blue-light"
                  )}
                >
                  <span
                    className={cx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isActive ? "bg-white/14 text-white" : "bg-brand-blue-light text-brand-blue group-hover:bg-brand-blue group-hover:text-white"
                    )}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]">
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                  </span>
                  <span className="flex w-full items-end justify-between gap-2">
                    <span>{link.label}</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24" className={cx("h-4 w-4 shrink-0 fill-none stroke-2", isActive ? "stroke-white/65" : "stroke-graphite-soft/35")}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6 9 12l6 6" />
                    </svg>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

          <Link
            href="/request"
            onClick={onClose}
            className="mt-2.5 flex items-center gap-3 rounded-[1.4rem] border border-brand-gold/25 bg-[#fffaf0] px-4 py-3.5 text-graphite transition-colors hover:border-brand-gold/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/16 text-[#9b6b16]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h13l-1.5 9.5a2 2 0 0 1-2 1.7H8.9a2 2 0 0 1-2-1.7L5 4H3M9.5 21h.01M17 21h.01" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold">{copy.request}</span>
              <span className="mt-0.5 block text-xs text-graphite-soft/62">{copy.requestHint}</span>
            </span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-graphite-soft/35 stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6 9 12l6 6" />
            </svg>
          </Link>

          {utilityLinks.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 px-1 text-xs font-black tracking-[0.08em] text-graphite-soft/58">{copy.more}</p>
              <ul className="overflow-hidden rounded-[1.35rem] border border-line/80 bg-white">
                {utilityLinks.map((link, index) => {
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <li key={link.href} className={cx(index > 0 && "border-t border-line/70")}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={cx(
                          "tap-target flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-colors hover:bg-surface",
                          isActive ? "text-brand-blue" : "text-graphite"
                        )}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-brand-blue stroke-[1.7]">
                          <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                        </svg>
                        <span className="flex-1">{link.label}</span>
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-graphite-soft/35 stroke-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 6 9 12l6 6" />
                        </svg>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

        <div className="sticky bottom-0 mt-auto border-t border-line/80 bg-white/95 px-4 pb-4 pt-3 shadow-[0_-18px_45px_-36px_rgba(10,22,36,0.8)] backdrop-blur-xl">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-extrabold text-graphite">{copy.help}</p>
              <p className="mt-0.5 text-xs text-graphite-soft/60">{copy.helpHint}</p>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PhoneButton
              phone={BUSINESS.phoneDisplay}
              label={copy.call}
              variant="outline"
              className="w-full !rounded-xl !px-3"
            />
            <WhatsAppButton
              message={buildWhatsAppGeneralMessage()}
              label={copy.whatsapp}
              trackAs="whatsapp_click_header"
              className="w-full !rounded-xl !px-3"
            />
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
