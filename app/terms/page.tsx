import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { buildMetadata } from "@/lib/seo/metadata";
import { BUSINESS } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "תנאי שימוש",
  description: "תנאי השימוש באתר חדד יובל אלקטריק בע״מ.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "תנאי שימוש", path: "/terms" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">תנאי שימוש</h1>
        <div className="mt-6 max-w-3xl">
          <SeoTextBlock>
            <p>
              עמוד זה הינו טיוטת מסגרת ראשונית (Placeholder) לתנאי השימוש באתר {BUSINESS.nameHe}, ואינו מהווה ייעוץ
              משפטי. יש להשלים ולאמת את הנוסח הסופי מול עורך דין לפני פרסום סופי.
            </p>
            <h3>מהות האתר</h3>
            <p>
              האתר מציג קטלוג מוצרי חשמל וזמינות כללית בלבד. אין באתר מחירים, אין אפשרות רכישה מקוונת ואין סליקת
              תשלומים. כל הזמנה מתבצעת ישירות מול צוות החנות בטלפון או בוואטסאפ, וכפופה לאישור החנות.
            </p>
            <h3>דיוק המידע</h3>
            <p>
              אנו משתדלים לשמור על עדכניות ודיוק המידע המוצג באתר, אך ייתכנו פערים בין הזמינות המוצגת באתר לבין
              המלאי בפועל בחנות. יש לראות בכל מידע באתר כמידע כללי בלבד, הכפוף לאישור סופי מול נציג החנות.
            </p>
            <h3>קניין רוחני</h3>
            <p>
              [TODO: להשלים נוסח משפטי מדויק בנוגע לזכויות יוצרים על תוכן האתר, תמונות ולוגו.]
            </p>
            <h3>יצירת קשר</h3>
            <p>לשאלות בנוגע לתנאי השימוש ניתן לפנות אלינו בטלפון {BUSINESS.phoneDisplay} או דרך עמוד יצירת הקשר.</p>
          </SeoTextBlock>
        </div>
      </div>
    </>
  );
}
