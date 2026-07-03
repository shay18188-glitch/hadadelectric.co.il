import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
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
