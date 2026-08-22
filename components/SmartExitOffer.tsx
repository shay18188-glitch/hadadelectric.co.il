"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  CONVERSION_INTENT_EVENT,
  hasConversionIntent,
  markConversionIntent,
  rememberExitOfferShown,
  shouldExcludeConversionUi,
  wasExitOfferShownRecently,
} from "@/lib/conversion-intent";
import { buildWhatsAppUrl } from "@/lib/whatsapp/messages";
import { getLocaleFromPathname, stripLocalePrefix } from "@/lib/i18n/locales";

type Status = "idle" | "submitting" | "success" | "error";

const DESKTOP_DELAY_MS = 15_000;
const MOBILE_DELAY_MS = 45_000;
const MOBILE_SCROLL_THRESHOLD = 0.6;

const OFFER_TEXT = {
  he: {
    closeAria: "סגירת החלונית",
    kicker: "לפני שממשיכים הלאה",
    title: "לא בטוחים איזה דגם מתאים?",
    description: "השאירו מספר ונחזור עם בדיקת זמינות והמלצה ממוקדת — בלי התחייבות ובלי שיחת מכירה ארוכה.",
    human: "ייעוץ אנושי",
    local: "חנות מקומית בנהריה",
    successTitle: "קיבלנו, תודה!",
    successBody: "צוות חדד אלקטריק יחזור אליכם בהקדם.",
    close: "סגירה",
    name: "שם מלא",
    phone: "טלפון לחזרה",
    interest: "איזה מוצר מעניין אתכם?",
    interestPlaceholder: "לדוגמה: מקרר 4 דלתות",
    consent: "אני מאשר/ת שימוש בפרטים לצורך יצירת קשר בלבד.",
    privacy: "מדיניות פרטיות",
    error: "השליחה לא הצליחה. אפשר לפנות אלינו מיד ב־WhatsApp.",
    submitting: "שולחים…",
    submit: "חזרו אליי עם המלצה",
    whatsapp: "מעדיפים WhatsApp? כתבו לנו עכשיו",
    reassurance: "ללא ספאם · ללא התחייבות · צוות החנות חוזר אליכם",
    whatsappIntro: "שלום יובל, אשמח לקבל ייעוץ קצר.",
    leadMessage: "בקשת חזרה מהחלונית החכמה",
    pageLabel: "עמוד",
  },
  en: {
    closeAria: "Close dialog",
    kicker: "Before you go",
    title: "Not sure which model fits?",
    description: "Leave your number and our store team will follow up with availability and a focused recommendation — no obligation.",
    human: "Personal advice",
    local: "Local Nahariya store",
    successTitle: "Thank you — we got it!",
    successBody: "The Hadad Electric team will contact you shortly.",
    close: "Close",
    name: "Full name",
    phone: "Phone number",
    interest: "Which product interests you?",
    interestPlaceholder: "For example: four-door refrigerator",
    consent: "I agree that my details may be used only to contact me.",
    privacy: "Privacy policy",
    error: "We couldn't send the form. You can contact us on WhatsApp now.",
    submitting: "Sending…",
    submit: "Call me with a recommendation",
    whatsapp: "Prefer WhatsApp? Message us now",
    reassurance: "No spam · No obligation · A real store team",
    whatsappIntro: "Hello, I'd like a quick product consultation.",
    leadMessage: "Callback request from the smart exit offer",
    pageLabel: "Page",
  },
  ru: {
    closeAria: "Закрыть окно",
    kicker: "Перед уходом",
    title: "Не уверены, какая модель подойдёт?",
    description: "Оставьте номер — команда магазина уточнит наличие и поможет с выбором без обязательств.",
    human: "Личная консультация",
    local: "Магазин в Нагарии",
    successTitle: "Спасибо, заявка получена!",
    successBody: "Команда Hadad Electric скоро свяжется с вами.",
    close: "Закрыть",
    name: "Полное имя",
    phone: "Номер телефона",
    interest: "Какой товар вас интересует?",
    interestPlaceholder: "Например: четырёхдверный холодильник",
    consent: "Я согласен(на) на использование данных только для связи со мной.",
    privacy: "Политика конфиденциальности",
    error: "Не удалось отправить форму. Напишите нам в WhatsApp.",
    submitting: "Отправка…",
    submit: "Перезвоните мне с рекомендацией",
    whatsapp: "Удобнее WhatsApp? Напишите сейчас",
    reassurance: "Без спама · Без обязательств · Ответит команда магазина",
    whatsappIntro: "Здравствуйте! Нужна короткая консультация по товару.",
    leadMessage: "Запрос обратного звонка из умного окна",
    pageLabel: "Страница",
  },
} as const;

function pageInterest(pathname: string): string {
  if (typeof document === "undefined") return "";
  const path = stripLocalePrefix(pathname);
  if (!/^\/(products|categories|brands|recommended|bundles)\//.test(path)) return "";
  const heading = document.querySelector("main h1")?.textContent?.trim() ?? "";
  return heading.slice(0, 160);
}

export function SmartExitOffer() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  if (shouldExcludeConversionUi(currentPath)) return null;

  return <SmartExitOfferController key={currentPath} pathname={currentPath} />;
}

function SmartExitOfferController({ pathname }: { pathname: string }) {
  const locale = getLocaleFromPathname(pathname);
  const t = OFFER_TEXT[locale];
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const shownThisSession = useRef(false);
  const timedReady = useRef(false);
  const mobileScrolledEnough = useRef(false);

  const showOffer = useCallback(() => {
    if (shownThisSession.current || hasConversionIntent() || wasExitOfferShownRecently()) return;
    shownThisSession.current = true;
    rememberExitOfferShown();
    setInterest((current) => current || pageInterest(pathname));
    setOpen(true);
    trackEvent("exit_offer_view", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    if (open) return;

    if (hasConversionIntent() || wasExitOfferShownRecently()) return;

    const desktop = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;
    timedReady.current = false;
    mobileScrolledEnough.current = false;

    const delay = window.setTimeout(() => {
      timedReady.current = true;
      if (!desktop && mobileScrolledEnough.current) showOffer();
    }, desktop ? DESKTOP_DELAY_MS : MOBILE_DELAY_MS);

    const onMouseOut = (event: MouseEvent) => {
      if (!desktop || !timedReady.current) return;
      if (event.clientY <= 8 && !event.relatedTarget) showOffer();
    };

    const onScroll = () => {
      if (desktop) return;
      const doc = document.documentElement;
      const progress = (window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1);
      if (progress >= MOBILE_SCROLL_THRESHOLD) {
        mobileScrolledEnough.current = true;
        if (timedReady.current) showOffer();
      }
    };

    const onConversion = () => {
      setOpen(false);
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(CONVERSION_INTENT_EVENT, onConversion);

    return () => {
      window.clearTimeout(delay);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(CONVERSION_INTENT_EVENT, onConversion);
    };
  }, [open, showOffer]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => firstInputRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    trackEvent("exit_offer_dismiss", { path: pathname });
  }, [pathname]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: "",
          relevantProduct: interest,
          message: `${t.leadMessage}. ${t.pageLabel}: ${pathname}`,
          company: "",
          privacyAccepted,
        }),
      });
      if (!response.ok) throw new Error("failed");
      markConversionIntent("form_submit");
      trackEvent("exit_offer_submit", { path: pathname });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const whatsappHref = useMemo(() => {
    const lines: string[] = [t.whatsappIntro];
    if (name.trim()) lines.push(`${t.name}: ${name.trim()}`);
    if (phone.trim()) lines.push(`${t.phone}: ${phone.trim()}`);
    if (interest.trim()) lines.push(`${t.interest}: ${interest.trim()}`);
    if (typeof window !== "undefined") lines.push(`${t.pageLabel}: ${window.location.href}`);
    return buildWhatsAppUrl(lines.join("\n"));
  }, [interest, name, phone, t]);

  if (!open) return null;

  return (
    <div
      className="sheet-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-[#061522]/72 p-0 backdrop-blur-[3px] md:items-center md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-offer-title"
        aria-describedby="exit-offer-description"
        dir={locale === "he" ? "rtl" : "ltr"}
        onKeyDown={handleDialogKeyDown}
        className="sheet-panel-bottom relative max-h-[94dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-[0_32px_110px_-30px_rgba(0,0,0,.65)] md:max-h-[90vh] md:max-w-3xl md:rounded-[2rem]"
      >
        <button
          type="button"
          onClick={close}
          aria-label={t.closeAria}
          className="tap-target absolute left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-xl text-graphite shadow-sm transition hover:bg-surface"
        >
          ×
        </button>

        <div className="grid md:grid-cols-[0.82fr_1.18fr]">
          <div className="blueprint-grid relative overflow-hidden bg-[#071a2c] px-6 py-7 text-white md:flex md:flex-col md:justify-center md:px-8 md:py-10">
            <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border border-brand-gold/20" aria-hidden="true" />
            <p className="text-xs font-black tracking-[0.14em] text-brand-gold">{t.kicker}</p>
            <h2 id="exit-offer-title" className="mt-3 text-2xl font-black leading-tight md:text-3xl">
              {t.title}
            </h2>
            <p id="exit-offer-description" className="mt-3 text-sm leading-6 text-white/72">
              {t.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-white/78">
              <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">{t.human}</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">{t.local}</span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {status === "success" ? (
              <div role="status" className="flex min-h-64 flex-col items-center justify-center text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-success-bg text-2xl text-success" aria-hidden="true">✓</span>
                <h3 className="mt-4 text-xl font-black text-graphite">{t.successTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite-soft/72">{t.successBody}</p>
                <button type="button" onClick={() => setOpen(false)} className="mt-5 rounded-full bg-graphite px-6 py-2.5 text-sm font-bold text-white">
                  {t.close}
                </button>
              </div>
            ) : (
              <form
                data-lead-form="exit-offer"
                onSubmit={handleSubmit}
                className="space-y-3.5"
              >
                <div>
                  <label htmlFor="exit-name" className="mb-1.5 block text-sm font-bold text-graphite">{t.name}</label>
                  <input
                    ref={firstInputRef}
                    id="exit-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div>
                  <label htmlFor="exit-phone" className="mb-1.5 block text-sm font-bold text-graphite">{t.phone}</label>
                  <input
                    id="exit-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    minLength={7}
                    autoComplete="tel"
                    className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div>
                  <label htmlFor="exit-interest" className="mb-1.5 block text-sm font-bold text-graphite">{t.interest}</label>
                  <input
                    id="exit-interest"
                    value={interest}
                    onChange={(event) => setInterest(event.target.value)}
                    required
                    placeholder={t.interestPlaceholder}
                    className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs leading-5 text-graphite-soft/70">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) => setPrivacyAccepted(event.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand-blue"
                  />
                  <span>{t.consent} <Link href="/privacy-policy" className="font-bold text-brand-blue hover:underline">{t.privacy}</Link></span>
                </label>

                {status === "error" && <p role="alert" className="text-sm font-semibold text-red-600">{t.error}</p>}

                <button
                  type="submit"
                  disabled={status === "submitting" || !privacyAccepted}
                  className="tap-target w-full rounded-full bg-brand-blue px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_28px_-16px_rgba(11,87,147,.9)] transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {status === "submitting" ? t.submitting : t.submit}
                </button>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    markConversionIntent("whatsapp");
                    trackEvent("exit_offer_whatsapp", { path: pathname });
                  }}
                  className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#20bf5b]/35 bg-[#20bf5b]/8 px-5 py-3 text-sm font-black text-[#128c4a] transition hover:bg-[#20bf5b]/14"
                >
                  {t.whatsapp}
                </a>
                <p className="text-center text-[11px] text-graphite-soft/52">{t.reassurance}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
