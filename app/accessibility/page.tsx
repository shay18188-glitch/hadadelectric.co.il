import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { buildMetadata } from "@/lib/seo/metadata";
import { BUSINESS } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של אתר חדד יובל אלקטריק בע״מ.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "הצהרת נגישות", path: "/accessibility" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">הצהרת נגישות</h1>
        <div className="mt-6 max-w-3xl">
          <SeoTextBlock>
            <p>
              {BUSINESS.nameHe} רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל הגולשים, לרבות אנשים עם מוגבלות. אתר זה
              תוכנן ונבנה תוך שאיפה לעמידה בהמלצות הנגישות המקובלות, אך עמוד זה הינו הצהרה ראשונית בלבד ואינו מהווה
              אישור בדיקת נגישות פורמלית שבוצעה בפועל.
            </p>
            <h3>אמצעי נגישות שמיושמים באתר</h3>
            <ul>
              <li>מבנה סמנטי עם כותרות, ניווט (nav) ואזור תוכן ראשי (main).</li>
              <li>אפשרות ניווט מלאה במקלדת עם מצבי מיקוד (focus) גלויים.</li>
              <li>טקסט חלופי (alt) לתמונות מוצרים ולוגו.</li>
              <li>ניגודיות צבעים נאותה בין טקסט לרקע.</li>
              <li>קישור &quot;דלג לתוכן הראשי&quot; בראש כל עמוד.</li>
            </ul>
            <h3>פנייה בנושא נגישות</h3>
            <p>
              [TODO: להשלים פרטי רכז נגישות רשמי אם קיים.] במידה ונתקלתם בבעיית נגישות באתר, נשמח שתפנו אלינו בטלפון{" "}
              {BUSINESS.phoneDisplay} או דרך עמוד יצירת הקשר, ונפעל לטפל בפנייה בהקדם האפשרי.
            </p>
          </SeoTextBlock>
        </div>
      </div>
    </>
  );
}
