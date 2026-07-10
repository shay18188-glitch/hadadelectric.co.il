import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";
import { LOCAL_PAGES } from "@/content/localPages";

export const metadata: Metadata = buildMetadata({
  title: "משלוחים והתקנה בצפון — מוצרי חשמל עד הבית",
  description:
    "משלוח והתקנת מוצרי חשמל בבית הלקוח בכל הצפון — מנהריה, עכו והקריות ועד צפת, טבריה וקריית שמונה. אזורי חלוקה, איך זה עובד ותיאום מלא מול צוות החנות, עם יחס אישי.",
  path: "/services/delivery",
});

const DELIVERY_ZONES: { zone: string; areas: { path: string; label: string }[]; note: string }[] = [
  {
    zone: "נהריה והסביבה הקרובה",
    areas: [
      { path: "/electric-appliances-nahariya", label: "נהריה" },
      { path: "/electric-appliances-shlomi", label: "שלומי" },
      { path: "/electric-appliances-acre", label: "עכו" },
      { path: "/electric-appliances-judeide-maker", label: "ג'דיידה-מכר" },
      { path: "/electric-appliances-yarka-area", label: "ירכא וכפר יאסיף" },
    ],
    note: "האזור הקרוב ביותר לחנות — משלוחים משתבצים בזמנים הקצרים ביותר.",
  },
  {
    zone: "הר הגליל והגליל המערבי",
    areas: [
      { path: "/electric-appliances-maalot", label: "מעלות-תרשיחא" },
      { path: "/electric-appliances-kfar-vradim", label: "כפר ורדים" },
      { path: "/electric-appliances-carmiel", label: "כרמיאל ומשגב" },
    ],
    note: "מסלולי חלוקה קבועים דרך כבישים 89 ו-85, כולל יישובים קטנים ומצפים.",
  },
  {
    zone: "מטרופולין חיפה והקריות",
    areas: [
      { path: "/electric-appliances-krayot", label: "הקריות" },
      { path: "/electric-appliances-kiryat-ata", label: "קריית אתא" },
      { path: "/electric-appliances-haifa", label: "חיפה" },
      { path: "/electric-appliances-yokneam", label: "יקנעם" },
    ],
    note: "כולל תיאום מיוחד לבנייה ותיקה — קומות גבוהות, חדרי מדרגות צרים וגישה מורכבת.",
  },
  {
    zone: "הגליל התחתון והעמקים",
    areas: [
      { path: "/electric-appliances-tamra", label: "טמרה" },
      { path: "/electric-appliances-shefaram", label: "שפרעם" },
      { path: "/electric-appliances-sakhnin", label: "סח'נין" },
      { path: "/electric-appliances-nazareth", label: "נצרת" },
      { path: "/electric-appliances-nof-hagalil", label: "נוף הגליל" },
      { path: "/electric-appliances-afula", label: "עפולה" },
    ],
    note: "מסלולי חלוקה מרוכזים — הזמנת חבילה של כמה מוצרים משתלמת במיוחד.",
  },
  {
    zone: "הגליל המזרחי, אצבע הגליל והגולן",
    areas: [
      { path: "/electric-appliances-safed", label: "צפת" },
      { path: "/electric-appliances-rosh-pina-hatzor", label: "ראש פינה וחצור" },
      { path: "/electric-appliances-tiberias", label: "טבריה" },
      { path: "/electric-appliances-kiryat-shmona", label: "קריית שמונה" },
      { path: "/electric-appliances-katzrin", label: "קצרין והגולן" },
    ],
    note: "מסלול מזרחי מתוכנן מראש — המועד מתואם אישית מול כל לקוח.",
  },
];

const DELIVERY_FAQ = [
  {
    question: "כמה עולה משלוח?",
    answer:
      "עלות ההובלה תלויה במוצר, ביעד ובתנאי הגישה (קומה, מעלית, מרחק חניה), והיא מוצגת מראש כחלק מהצעת המחיר — לפני שאתם מתחייבים. בהזמנה מרוכזת של כמה מוצרים ההובלה מתחלקת ומשתלמת יותר.",
  },
  {
    question: "האם אתם גם מתקינים את המוצר בבית?",
    answer:
      "כן — חיבור מכונות כביסה ומדיחים, התקנת תנורים בנויים, תליית טלוויזיות והתקנת מזגנים (על ידי מתקינים מוסמכים) מתואמים כחלק מההזמנה. ספרו לנו מה נדרש ותקבלו הכול בהצעה אחת מסודרת.",
  },
  {
    question: "תוך כמה זמן מגיע המשלוח?",
    answer:
      "תלוי ביעד ובזמינות המוצר: לאזור נהריה-עכו-שלומי בדרך כלל ימים בודדים, ליעדים מרוחקים יותר — לפי שיבוץ מסלולי החלוקה, לרוב עד שבוע. בכל מקרה המועד המדויק נסגר איתכם מראש, ואנחנו עומדים בו.",
  },
  {
    question: "מה קורה אם המוצר לא עובר בדלת או בחדר המדרגות?",
    answer:
      "זה בדיוק מה שאנחנו מונעים מראש: לפני האספקה עוברים איתכם על מידות המוצר ומסלול ההכנסה. במקרים מורכבים (סמטאות, מדרגות צרות) מתאמים פתרון מותאם עוד לפני ההזמנה — כדי שביום המשלוח לא יהיו הפתעות.",
  },
  {
    question: "האם אפשר לתאם פינוי של המוצר הישן?",
    answer:
      "ברוב המקרים ניתן לתאם פינוי מוצר ישן יחד עם האספקה — ציינו זאת בעת ההזמנה והצוות יאשר את הפרטים והעלות מראש.",
  },
  {
    question: "אני גר ביישוב שלא מופיע ברשימה — אתם מגיעים?",
    answer:
      "כמעט בוודאות כן: אנחנו מספקים לכל אזור הצפון, כולל מושבים, קיבוצים ומצפים. שלחו בוואטסאפ את שם היישוב והמוצר, ונאשר את האספקה ואת המועד.",
  },
];

export default function DeliveryPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "משלוחים והתקנה בצפון", path: "/services/delivery" }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">משלוחים והתקנה בצפון — עד הבית שלכם</h1>

        <div className="mt-4 max-w-3xl md:mt-5">
          <SeoTextBlock>
            <p>
              קניתם מוצר חשמל? מכאן והלאה זו העבודה שלנו: משלוח עד בית הלקוח, הכנסה מסודרת, התקנה וחיבור —
              בכל אזור הצפון, מקו חיפה והקריות ועד קריית שמונה והגולן. אנחנו מתאמים איתכם מראש יום ושעה,
              עוברים יחד על תנאי הגישה, ומגיעים מוכנים. יחס אישי מהרגע שהזמנתם ועד שהמוצר עובד אצלכם בבית.
            </p>
            <p>
              ההובלה מתבצעת על ידי צוותים שמכירים את הצפון על כל סוגי הבנייה שבו — בניינים בלי מעלית בחיפה
              ובנוף הגליל, בתים פרטיים עם מדרגות חיצוניות בהר הגליל, סמטאות בעכו העתיקה ובצפת. התקנות חשמל
              ומיזוג מתבצעות על ידי אנשי מקצוע מוסמכים, והכול נסגר מראש בהצעת המחיר — בלי הפתעות ביום האספקה.
            </p>
          </SeoTextBlock>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
          <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
          <PhoneButton phone={BUSINESS.phoneDisplay} />
          <Link
            href="/products"
            className="tap-target inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-graphite hover:bg-surface"
          >
            לקטלוג המוצרים
          </Link>
        </div>

        <section className="mt-10 md:mt-14" aria-labelledby="zones-heading">
          <h2 id="zones-heading" className="text-lg font-bold text-graphite md:text-2xl">
            אזורי החלוקה שלנו
          </h2>
          <div className="mt-4 grid gap-3 md:gap-4">
            {DELIVERY_ZONES.map((zone) => (
              <div key={zone.zone} className="rounded-2xl border border-line bg-white p-4 md:p-5">
                <h3 className="text-[15px] font-bold text-graphite md:text-base">{zone.zone}</h3>
                <p className="mt-1 text-sm text-graphite-soft/80">{zone.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {zone.areas.map((area) => (
                    <Link
                      key={area.path}
                      href={area.path}
                      className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                    >
                      {area.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-graphite-soft/60">
            מועדי אספקה, עלויות הובלה והתקנה נקבעים בתיאום אישי מול צוות החנות וכפופים לאישור סופי בעת ההזמנה.
          </p>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-lg font-bold text-graphite md:text-2xl">
            איך זה עובד — שלב אחרי שלב
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
            {[
              { title: "בוחרים ומזמינים", desc: "מוצאים מוצר בקטלוג, שולחים וואטסאפ ומקבלים הצעת מחיר הכוללת הובלה והתקנה." },
              { title: "מתאמים מועד", desc: "קובעים יחד יום ושעה, ועוברים על פרטי הגישה — קומה, מעלית, חניה." },
              { title: "מספקים ומכניסים", desc: "הצוות מגיע בזמן שנקבע, מכניס את המוצר בזהירות עד המיקום המדויק בבית." },
              { title: "מתקינים ומחברים", desc: "חיבור, התקנה והפעלה ראשונה — עוזבים רק כשהמוצר עובד ואתם מרוצים." },
            ].map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-line bg-white p-4 md:p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue-light text-sm font-bold text-brand-blue">
                  {index + 1}
                </span>
                <h3 className="mt-2 text-[15px] font-bold text-graphite">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite-soft/80">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="delivery-faq-heading">
          <h2 id="delivery-faq-heading" className="text-lg font-bold text-graphite md:text-2xl">
            שאלות נפוצות על משלוחים והתקנה
          </h2>
          <div className="mt-3 max-w-3xl md:mt-4">
            <FaqAccordion items={DELIVERY_FAQ} />
          </div>
          <JsonLd data={faqJsonLd(DELIVERY_FAQ)} />
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="all-areas-heading">
          <h2 id="all-areas-heading" className="text-lg font-bold text-graphite md:text-2xl">
            כל אזורי השירות שלנו
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {LOCAL_PAGES.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              >
                {page.city}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
