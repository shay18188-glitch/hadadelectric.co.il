import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";
import { BUSINESS_HOURS } from "@/content/businessHours";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "צור קשר",
  description: "פרטי יצירת קשר עם חדד יובל אלקטריק בע״מ בנהריה — טלפון, וואטסאפ, כתובת ופייסבוק.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "צור קשר", path: "/contact" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">צור קשר</h1>
        <p className="mt-3 max-w-2xl text-sm text-graphite-soft/80 md:text-base">
          נשמח לעזור בבדיקת זמינות, ייעוץ מקצועי או תיאום הזמנה. ניתן לפנות בכל אחד מהאמצעים הבאים.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-lg font-bold text-graphite">{BUSINESS.nameHe}</h2>
              <address className="mt-3 space-y-2 text-sm not-italic text-graphite-soft/80">
                <p>
                  {BUSINESS.addressStreet}, {BUSINESS.addressCity}
                </p>
                <p>טלפון: {BUSINESS.phoneDisplay}</p>
                <p>וואטסאפ: {BUSINESS.mobileDisplay}</p>
                <p>
                  <a href={BUSINESS.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                    עמוד הפייסבוק שלנו
                  </a>
                </p>
              </address>

              <div className="mt-5 flex flex-wrap gap-3">
                <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
                <PhoneButton phone={BUSINESS.phoneDisplay} />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-lg font-bold text-graphite">שעות פעילות</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-graphite-soft/80">
                {BUSINESS_HOURS.map((entry) => (
                  <li key={entry.day} className="flex justify-between gap-4">
                    <span>{entry.day}</span>
                    <span>{entry.hours}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-graphite-soft/50">
                * שעות הפעילות המדויקות בכפוף לאישור החנות — מומלץ לתאם מראש בטלפון או בוואטסאפ.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe
                title="מיקום החנות במפה — לוחמי הגטאות 3, נהריה"
                src="https://www.google.com/maps?q=%D7%9C%D7%95%D7%97%D7%9E%D7%99+%D7%94%D7%92%D7%98%D7%90%D7%95%D7%AA+3+%D7%A0%D7%94%D7%A8%D7%99%D7%94&output=embed"
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-bold text-graphite">שליחת הודעה</h2>
            <p className="mt-1 text-sm text-graphite-soft/70">נחזור אליכם בהקדם האפשרי.</p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
