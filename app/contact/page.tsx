import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { GoogleRating } from "@/components/GoogleRating";
import { BusinessProfiles } from "@/components/BusinessProfiles";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";
import { BUSINESS_HOURS } from "@/content/businessHours";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "צור קשר — חדד יובל אלקטריק בנהריה",
  description:
    "יצירת קשר עם חדד יובל אלקטריק בע״מ — טלפון 04-9920948, וואטסאפ 052-2692235, כתובת בנהריה, שעות פעילות וטופס פנייה. בדיקת זמינות והזמנת מוצרי חשמל.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "צור קשר", path: "/contact" }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">צור קשר</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:mt-4 md:text-base">
          נשמח לעזור בבדיקת זמינות מוצר, ייעוץ מקצועי בבחירת מוצר חשמל לבית, או תיאום הזמנה. ניתן לפנות אלינו בטלפון,
          בוואטסאפ, בטופס למטה, או בביקור בחנות בנהריה.
        </p>

        <div className="mt-5 max-w-3xl md:mt-6">
          <SeoTextBlock>
            <p>
              {BUSINESS.nameHe} ממוקמת ב{BUSINESS.addressStreet}, {BUSINESS.addressCity}. אנו משרתים לקוחות פרטיים
              מנהריה ומכל אזור הצפון — מקו חיפה והקריות ועד הגבול עם לבנון. האתר מציג קטלוג מוצרי חשמל ללא מחירים;
              לקבלת הצעה והזמנה — פנו אלינו ישירות.
            </p>
          </SeoTextBlock>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-10 md:mt-10">
          <div className="space-y-5 md:space-y-6">
            <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
              <h2 className="text-lg font-bold text-graphite">פרטי התקשרות</h2>
              <address className="mt-3 space-y-2 text-sm not-italic text-graphite-soft/80">
                <p className="font-medium text-graphite">{BUSINESS.nameHe}</p>
                <p>
                  {BUSINESS.addressStreet}, {BUSINESS.addressCity}
                </p>
                <p>
                  טלפון:{" "}
                  <a href={BUSINESS.phoneHref} className="text-brand-blue hover:underline">
                    {BUSINESS.phoneDisplay}
                  </a>
                </p>
                <p>
                  וואטסאפ:{" "}
                  <a href="tel:0522692235" className="text-brand-blue hover:underline">
                    {BUSINESS.mobileDisplay}
                  </a>
                </p>
                <p>
                  <a
                    href={BUSINESS.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue hover:underline"
                  >
                    עמוד הפייסבוק שלנו
                  </a>
                </p>
              </address>

              <div className="mt-5 flex flex-wrap gap-3">
                <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
                <PhoneButton phone={BUSINESS.phoneDisplay} />
              </div>

              <div className="mt-5">
                <GoogleRating />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
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
                שעות הפעילות המדויקות בכפוף לאישור החנות — מומלץ לתאם מראש בטלפון או בוואטסאפ, במיוחד בערבי חג
                ושבתות.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 md:p-6">
              <h2 className="text-lg font-bold text-graphite">קישורים שימושיים</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/products" className="text-brand-blue hover:underline">
                    קטלוג מוצרי חשמל
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-brand-blue hover:underline">
                    שאלות נפוצות
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-brand-blue hover:underline">
                    אודות החנות
                  </Link>
                </li>
                <li>
                  <Link href="/electric-appliances-nahariya" className="text-brand-blue hover:underline">
                    מוצרי חשמל בנהריה
                  </Link>
                </li>
              </ul>
              <div className="mt-4 border-t border-line pt-4">
                <BusinessProfiles />
              </div>
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

          <div className="rounded-2xl border border-line bg-white p-5 md:p-6 lg:sticky lg:top-24 lg:h-fit">
            <h2 className="text-lg font-bold text-graphite">שליחת הודעה</h2>
            <p className="mt-1 text-sm text-graphite-soft/70">
              מלאו את הפרטים ונחזור אליכם בהקדם. השדות המסומנים ב-* הם חובה.
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
            <p className="mt-4 text-xs text-graphite-soft/60">
              שליחת הטופס מהווה הסכמה ל{" "}
              <Link href="/privacy-policy" className="text-brand-blue hover:underline">
                מדיניות הפרטיות
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
