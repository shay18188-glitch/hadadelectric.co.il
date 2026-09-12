import type { Metadata } from "next";
import Link from "next/link";
import { getFitCandidates } from "@/lib/seo/catalogDimensions";
import { NicheFitCalculator } from "@/components/NicheFitCalculator";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/schema/jsonld";

/**
 * The measurement question, answered against real stock.
 *
 * Measured-dimension content is the only template on this site that ranks for
 * non-brand demand — /guides/built-in-appliance-dimensions holds position 6.75
 * and /guides/oven-dimensions reached 7.42 within nineteen days. Those pages
 * answer "how big is this category". They cannot answer the question a person
 * standing in a kitchen with a tape measure actually has, which is the inverse:
 * given this gap, what fits.
 *
 * Nothing here is generated or estimated. Every row comes from a spec sheet the
 * supplier published, through the same parser the dimension tables use, and a
 * model without a parseable measurement is absent rather than guessed at.
 */

export const revalidate = 10800; // 3 hours

const FAQ = [
  {
    question: "מאיפה מגיעות המידות בכלי?",
    answer:
      "מגיליון המפרט של היצרן או היבואן, כפי שהוא מופיע ברשומת המוצר בקטלוג של החנות. דגם שלא פורסמה עבורו מידה מדויקת פשוט לא מופיע כאן — אנחנו לא משלימים ולא מעגלים מידות.",
  },
  {
    question: "הכלי כבר מוריד מרווח אוורור מהתוצאה?",
    answer:
      "לא, ובכוונה. מרווח האוורור והחיבורים משתנה בין סוגי מוצרים ובין התקנות, והורדה אוטומטית של כמה סנטימטרים הייתה או מסתירה דגמים שכן נכנסים או מבטיחה דגמים שלא. במקום זה הכלי מציג לכם את המרווח שנשאר בכל ציר, ומסמן מרווח קטן מ‑2 ס״מ.",
  },
  {
    question: "כמה מרווח באמת צריך להשאיר?",
    answer:
      "כלל אצבע: 2–3 ס״מ לכל צד להכנסה ולאוורור, ועוד 5–10 ס״מ מאחור לצנרת ולחיבור החשמל. במקרר כדאי גם 5–10 ס״מ מעל לאוורור המעבה. אלה הנחיות כלליות — ההוראות של הדגם הספציפי גוברות.",
  },
  {
    question: "מדדתי והדגם נכנס בול. זה מספיק?",
    answer:
      "לא. חוץ מהנישה עצמה צריך למדוד גם את מסלול ההכנסה: רוחב דלת הכניסה, המסדרון והפנייה בחדר המדרגות. מוצר באריזה רחב ב‑3 עד 5 ס״מ מהמוצר עצמו, ובבניינים ותיקים בצפון זו לא פעם המידה שמכריעה.",
  },
];

export const metadata: Metadata = buildMetadata({
  title: "מחשבון התאמת נישה — איזה מוצר חשמל נכנס לכם במידות",
  absoluteTitle: true,
  description:
    "הזינו את מידות הנישה וקבלו את הדגמים מהקטלוג שנכנסים בפועל — מקררים, מכונות כביסה, מייבשים, מדיחים, תנורים וכיריים, לפי מידות מדודות מגיליונות המפרט.",
  path: "/tools/niche-fit",
});

export default async function Page() {
  const candidates = await getFitCandidates();
  const inStock = candidates.filter((c) => c.inStock).length;

  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <Breadcrumbs items={[{ name: "מחשבון התאמת נישה", path: "/tools/niche-fit" }]} />
      <div className="container-page pb-12 md:pb-16">
        <div className="page-intro-shell">
          <p className="section-kicker">כלי מדידה</p>
          <h1 className="heading-balance mt-2 text-3xl font-black leading-[1.08] tracking-[-0.035em] text-graphite md:text-5xl">
            מה נכנס לכם בנישה?
          </h1>
          <div className="mt-4 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/85 md:text-base">
            <p>
              מדדתם את הפתח במטבח או במרפסת השירות — עכשיו תראו אילו דגמים באמת נכנסים. הכלי בודק את
              המידות שלכם מול {candidates.length} דגמים שפורסמו עבורם מידות מדויקות בקטלוג שלנו, מתוכם{" "}
              {inStock} זמינים כרגע.
            </p>
            <p className="mt-3">
              המידות כאן הן של גוף המוצר בלבד, כפי שהיצרן פרסם אותן. הכלי לא מוריד מרווח אוורור
              אוטומטית — הוא מראה לכם כמה מקום נשאר, וההחלטה נשארת אצלכם.
            </p>
          </div>
        </div>

        <NicheFitCalculator candidates={candidates} />

        <section className="mt-12 md:mt-16" aria-labelledby="niche-faq-heading">
          <h2 id="niche-faq-heading" className="text-xl font-black text-graphite md:text-2xl">
            שאלות על מדידה
          </h2>
          <dl className="mt-4 flex flex-col gap-3">
            {FAQ.map((item) => (
              <div key={item.question} className="rounded-2xl border border-line bg-white px-4 py-3.5">
                <dt className="text-sm font-bold text-graphite">{item.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-graphite-soft/85">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="niche-guides-heading">
          <h2 id="niche-guides-heading" className="text-lg font-bold text-graphite md:text-2xl">
            מדריכי המידות המלאים
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["built-in-appliance-dimensions", "מידות מוצרי חשמל בנויים"],
              ["washing-machine-dimensions", "מידות מכונת כביסה"],
              ["refrigerator-4-door-dimensions", "מידות מקרר 4 דלתות"],
              ["dishwasher-dimensions", "מידות מדיח כלים"],
              ["dryer-dimensions", "מידות מייבש כביסה"],
              ["oven-dimensions", "מידות תנור בנוי"],
            ].map(([slug, label]) => (
              <li key={slug}>
                <Link
                  href={`/guides/${slug}`}
                  className="block rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:text-brand-blue md:p-5"
                >
                  {label} ←
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
