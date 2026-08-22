"use client";

import { usePathname } from "next/navigation";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";
import { shouldExcludePersistentCta } from "@/lib/conversion-intent";
import { getLocaleFromPathname, stripLocalePrefix } from "@/lib/i18n/locales";

const CTA_LABELS = {
  he: { whatsapp: "ייעוץ בוואטסאפ", call: "התקשרו עכשיו" },
  en: { whatsapp: "WhatsApp us", call: "Call now" },
  ru: { whatsapp: "WhatsApp", call: "Позвонить" },
} as const;

/**
 * Global mobile sticky CTA (WhatsApp + call). Hidden on product detail pages,
 * where `ProductStickyCta` renders a richer 3-button bar (add to request /
 * WhatsApp / call) instead, so only one bottom bar is ever visible at once.
 */
export function StickyMobileCta() {
  const pathname = usePathname();
  const basePath = stripLocalePrefix(pathname ?? "/");
  const locale = getLocaleFromPathname(pathname ?? "/");
  const labels = CTA_LABELS[locale];
  const isHebrewProductDetail = locale === "he" && /^\/products\/[^/]+/.test(basePath);

  if (isHebrewProductDetail || shouldExcludePersistentCta(pathname ?? "/")) return null;

  return (
    <>
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:hidden" aria-hidden="true" />
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white/95 p-3 shadow-[0_-8px_24px_-12px_rgba(16,21,28,0.18)] backdrop-blur-lg md:hidden">
        <WhatsAppButton
          message={buildWhatsAppGeneralMessage(locale)}
          label={labels.whatsapp}
          trackAs="whatsapp_click_header"
          className="flex-1"
          size="md"
        />
        <PhoneButton phone={BUSINESS.phoneDisplay} label={labels.call} variant="primary" className="flex-1" size="md" />
      </div>
    </>
  );
}
