import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { ENERGY_TOOLS } from "@/content/energyTools";
import { getGuideBySlug } from "@/content/guides";
import { ENERGY_GUIDE_SLUGS } from "@/content/guides.energy";
import { KAMAYOTZE, TARIFF_AGOROT_INC_VAT, TARIFF_FROM_HE } from "@/lib/energy/tariff";
import { collectionPageJsonLd } from "@/lib/schema/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "מחשבוני חשמל ומידות למוצרי חשמל",
  description:
    "מחשבוני צריכת חשמל למוצרי חשמל לבית: גודל מזגן לחדר ועלות הפעלה, עלות חשמל של מקרר, זמן הדלקת דוד, וואט לאמפר והתאמת נישה — עם הדגמים המתאימים מהקטלוג.",
  path: "/tools",
});

const KAMAYOTZE_MORE = ["bill", "appliance", "ac", "waterHeater", "amps", "evCost", "evTime", "evVsGas"] as const;

export default function ToolsIndexPage() {
  const guides = ENERGY_GUIDE_SLUGS.map((slug) => getGuideBySlug(slug)).filter(
    (guide): guide is NonNullable<typeof guide> => Boolean(guide)
  );

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: "מחשבוני חשמל ומידות",
          description: "מחשבוני צריכת חשמל, גודל מזגן ומידות למוצרי חשמל לבית.",
          path: "/tools",
          items: [...ENERGY_TOOLS.map((tool) => ({ name: tool.title, path: tool.path })), { name: "מחשבון התאמת נישה", path: "/tools/niche-fit" }],
        })}
      />
      <Breadcrumbs items={[{ name: "מחשבונים", path: "/tools" }]} />
      <div className="container-page pb-12 md:pb-16">
        <PageHero
          eyebrow="לחשב לפני שבוחרים"
          title="מחשבוני חשמל למוצרי חשמל"
          description="כמה כ״ס מזגן צריך לחדר, כמה עולה המקרר בשנה, כמה זמן להדליק את הדוד ואם התנור החדש יעמוד בשקע — עם התשובה בשקלים ועם הדגמים מהקטלוג שמתאימים לה."
          imageSrc="/images/redesign/category-small-appliances.png"
          imageAlt="מוצרי חשמל למטבח"
          imageClassName="object-[56%_center] md:object-center"
          badges={
            <>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                תעריף {TARIFF_AGOROT_INC_VAT} אג׳ לקוט״ש מ־{TARIFF_FROM_HE}
              </span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">נתונים מהמפרט של כל דגם</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">חינם, בלי הרשמה</span>
            </>
          }
        />

        <ul className="mt-9 grid gap-5 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
          {ENERGY_TOOLS.map((tool) => (
            <li key={tool.path}>
              <Link
                href={tool.path}
                className="tap-scale flex h-full flex-col rounded-[1.6rem] border border-line/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl md:p-7"
              >
                <p className="section-kicker !text-[.8rem]">{tool.kicker}</p>
                <h2 className="mt-3 text-xl font-black leading-snug text-graphite">{tool.title}</h2>
                <p className="mt-3 text-base leading-7 text-graphite-soft/75">{tool.short}</p>
                <span className="mt-auto pt-5 text-base font-bold text-brand-blue">לחישוב ←</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/tools/niche-fit"
              className="tap-scale flex h-full flex-col rounded-[1.6rem] border border-line/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl md:p-7"
            >
              <p className="section-kicker !text-[.8rem]">מידות</p>
              <h2 className="mt-3 text-xl font-black leading-snug text-graphite">מחשבון התאמת נישה</h2>
              <p className="mt-3 text-base leading-7 text-graphite-soft/75">
                הזינו את מידות הפתח וקבלו את המקררים, מכונות הכביסה והתנורים מהקטלוג שנכנסים בו.
              </p>
              <span className="mt-auto pt-5 text-base font-bold text-brand-blue">לחישוב ←</span>
            </Link>
          </li>
        </ul>

        {guides.length > 0 && (
          <section className="mt-12 md:mt-16" aria-labelledby="tools-guides-heading">
            <h2 id="tools-guides-heading" className="text-xl font-black text-graphite md:text-2xl">
              מדריכים על צריכת חשמל
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="block h-full rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand-blue/40 md:p-5"
                  >
                    <span className="block text-sm font-bold text-graphite">{guide.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-graphite-soft/70">{guide.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 rounded-[1.75rem] border border-line/75 bg-white p-6 md:mt-16 md:p-8" aria-labelledby="tools-kamayotze-heading">
          <p className="section-kicker">מחשבונים נוספים לבית ולאנרגיה</p>
          <h2 id="tools-kamayotze-heading" className="mt-2 text-xl font-black text-graphite md:text-2xl">
            באתר ״כמה יוצא״
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-graphite-soft/80 md:text-base">
            ל־
            <a href={KAMAYOTZE.home.href} className="font-semibold text-brand-blue hover:underline">
              כמה יוצא
            </a>{" "}
            יש מחשבונים מפורטים לחשבון החשמל המלא (כולל תשלום קבוע ורכיב קיבולת), לחשמל תלת־פאזי ולטעינת רכב חשמלי
            בבית — באותו תעריף שבו משתמשים המחשבונים כאן.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {KAMAYOTZE_MORE.map((key) => (
              <li key={key}>
                <a href={KAMAYOTZE[key].href} className="block h-full rounded-2xl border border-line p-4 transition-colors hover:border-brand-blue/40">
                  <span className="block text-sm font-bold text-brand-blue">{KAMAYOTZE[key].label} ←</span>
                  <span className="mt-1 block text-xs leading-relaxed text-graphite-soft/70">{KAMAYOTZE[key].description}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
