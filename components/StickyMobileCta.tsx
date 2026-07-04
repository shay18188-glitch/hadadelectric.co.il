"use client";

import { usePathname } from "next/navigation";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

/**
 * Global mobile sticky CTA (WhatsApp + call). Hidden on product detail pages,
 * where `ProductStickyCta` renders a richer 3-button bar (add to request /
 * WhatsApp / call) instead, so only one bottom bar is ever visible at once.
 */
export function StickyMobileCta() {
  const pathname = usePathname();
  const isProductDetail = /^\/products\/[^/]+/.test(pathname ?? "");

  if (isProductDetail) return null;

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white/95 p-3 shadow-[0_-8px_24px_-12px_rgba(16,21,28,0.18)] backdrop-blur-lg md:hidden">
      <WhatsAppButton
        message={buildWhatsAppGeneralMessage()}
        trackAs="whatsapp_click_header"
        className="flex-1"
        size="md"
      />
      <PhoneButton phone={BUSINESS.phoneDisplay} variant="primary" className="flex-1" size="md" />
    </div>
  );
}
