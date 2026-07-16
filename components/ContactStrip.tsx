import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

export function ContactStrip() {
  return (
    <section className="blueprint-grid relative overflow-hidden rounded-[2rem] bg-[#071a2c] px-6 py-10 text-center text-white shadow-[0_30px_80px_-45px_rgba(7,26,44,0.8)] md:px-16 md:py-16">
      <div className="absolute -left-14 -top-16 h-48 w-48 rounded-full border border-brand-gold/20" aria-hidden="true" />
      <div className="absolute -left-4 -top-6 h-28 w-28 rounded-full border border-brand-gold/15" aria-hidden="true" />
      <p className="section-kicker justify-center !text-brand-gold before:!bg-brand-gold">ייעוץ אישי, בלי לחץ</p>
      <h2 className="mt-3 text-2xl font-black leading-tight md:text-4xl">בואו נמצא יחד את המוצר הנכון לבית שלכם</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
        צוות {BUSINESS.nameHe} ישמח לסייע בבדיקת זמינות מוצר, המלצה מקצועית או תיאום הזמנה — בוואטסאפ או בטלפון.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
