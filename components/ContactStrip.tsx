import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

export function ContactStrip() {
  return (
    <section className="rounded-3xl bg-graphite px-6 py-10 text-center text-white md:px-16 md:py-14">
      <h2 className="text-xl font-bold md:text-3xl">זמינים לכל שאלה — דברו איתנו עוד היום</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 md:text-base">
        צוות {BUSINESS.nameHe} ישמח לסייע בבדיקת זמינות מוצר, המלצה מקצועית או תיאום הזמנה — בוואטסאפ או בטלפון.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <WhatsAppButton message={buildWhatsAppGeneralMessage()} size="lg" trackAs="whatsapp_click_header" />
        <PhoneButton
          phone={BUSINESS.phoneDisplay}
          size="lg"
          variant="outline"
          className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
        />
      </div>
    </section>
  );
}
