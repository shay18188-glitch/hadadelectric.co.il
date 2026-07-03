import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { buildMetadata } from "@/lib/seo/metadata";
import { BUSINESS } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של אתר חדד יובל אלקטריק בע״מ.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "מדיניות פרטיות", path: "/privacy-policy" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">מדיניות פרטיות</h1>
        <div className="mt-6 max-w-3xl">
          <SeoTextBlock>
            <p>
              עמוד זה הינו טיוטת מסגרת ראשונית (Placeholder) למדיניות הפרטיות של אתר {BUSINESS.nameHe}, ואינו מהווה
              ייעוץ משפטי. יש להשלים ולאמת את הנוסח הסופי מול עורך דין לפני פרסום סופי.
            </p>
            <h3>איזה מידע אנו אוספים</h3>
            <p>
              [TODO: להשלים פירוט מדויק — לדוגמה: פרטי יצירת קשר שנמסרים דרך טופס יצירת הקשר (שם, טלפון, אימייל
              והודעה), ונתוני שימוש כלליים באתר לצורכי ניתוח וסטטיסטיקה.]
            </p>
            <h3>כיצד אנו משתמשים במידע</h3>
            <p>
              [TODO: להשלים — לדוגמה: לצורך מענה לפניות, שיפור השירות והתקשרות עם לקוחות בהתאם לבקשתם.]
            </p>
            <h3>שיתוף מידע עם צדדים שלישיים</h3>
            <p>
              [TODO: להשלים בהתאם לשירותים בפועל — לדוגמה: שירותי אנליטיקס כגון Google Analytics, במידה ומופעלים.]
            </p>
            <h3>יצירת קשר בנושא פרטיות</h3>
            <p>לשאלות בנוגע למדיניות הפרטיות ניתן לפנות אלינו בטלפון {BUSINESS.phoneDisplay} או דרך עמוד יצירת הקשר.</p>
          </SeoTextBlock>
        </div>
      </div>
    </>
  );
}
