import type { Metadata } from "next";
import { AcCostCalculator } from "@/components/energy/AcCostCalculator";
import { ToolPageLayout } from "@/components/energy/ToolPageLayout";
import { energyToolByPath } from "@/content/energyTools";
import { getAcCandidates } from "@/lib/energy/catalogEnergy";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * "Which size air conditioner" and "what does it cost to run" are the two
 * air-conditioning queries with real volume, and they are one decision. The
 * page answers both, then lists the catalog's units of the recommended size,
 * each costed at its own published BTU.
 */

export const revalidate = 10800; // 3 hours

const PATH = "/tools/air-conditioner-cost";

export const metadata: Metadata = buildMetadata({
  title: "מחשבון מזגן — כמה כ״ס לחדר וכמה עולה להפעיל",
  absoluteTitle: true,
  description:
    "כמה כ״ס מזגן צריך לחדר לפי מ״ר, כמה עולה להפעיל אותו לשעה ולחודש בתעריף 2026, ואילו מזגנים מהקטלוג של חדד אלקטריק מתאימים לגודל.",
  path: PATH,
});

const FAQ = [
  {
    question: "כמה כ״ס מזגן צריך לחדר של 12 מ״ר?",
    answer:
      "לפי כלל האצבע של 650 BTU למ״ר ועוד 500 לכל אדם, חדר של 12 מ״ר עם שני אנשים צריך כ־8,800 BTU — מזגן של 1 כ״ס. חדר בקומה עליונה או עם חשיפה גדולה לשמש צריך דרגה אחת מעל.",
  },
  {
    question: "כמה עולה להפעיל מזגן של 1.5 כ״ס?",
    answer:
      "מזגן של 1.5 כ״ס (13,500 BTU) במקדם יעילות 3.5 צורך כ־1.13 קילוואט בהספק מלא — 72 אגורות לשעה. בעומס ממוצע של 70%, 8 שעות ביום, זה כ־121 ₪ בחודש.",
  },
  {
    question: "מה זה COP, ולמה הוא משנה את החשבון?",
    answer:
      "COP הוא היחס בין הקירור שהמזגן מפיק לחשמל שהוא צורך. מזגן עם COP של 4 צורך רבע פחות חשמל ממזגן עם COP של 3 על אותו קירור. הנתון מופיע במפרט כ־COP, EER או SEER, וברוב המזגנים בקטלוג שלנו הוא כתוב בעמוד המוצר.",
  },
  {
    question: "מזגן גדול מדי זה בעיה?",
    answer:
      "כן, במידה. מזגן גדול בהרבה מהחדר מקרר מהר ונכבה, מסלק פחות לחות ועולה יותר בקנייה. מזגן קטן מדי עובד בהספק מלא כל הזמן ולא מגיע לטמפרטורה ביום חם. המטרה היא הגודל המתאים, עם מרווח קטן כלפי מעלה.",
  },
  {
    question: "אינוורטר באמת חוסך?",
    answer:
      "ברוב השימוש הביתי — כן. מזגן אינוורטר מוריד הספק כשהחדר מגיע לטמפרטורה במקום לכבות ולהידלק, ולכן עובד רוב הזמן מתחת להספק המלא. במחשבון זה מתבטא בעומס הממוצע: 50%–70% לאינוורטר, קרוב ל־100% למזגן ON/OFF ביום חם.",
  },
];

export default async function Page() {
  const tool = energyToolByPath(PATH)!;
  const candidates = await getAcCandidates();
  const inStock = candidates.filter((c) => c.inStock).length;

  return (
    <ToolPageLayout
      tool={tool}
      heading="איזה מזגן צריך לחדר, וכמה הוא יעלה בחשמל?"
      intro={
        <p>
          הזינו את שטח החדר וקבלו את גודל המזגן המומלץ בכ״ס וב־BTU, את עלות ההפעלה לשעה, לחודש ולעונה — ואת
          הדגמים מהקטלוג שלנו שמתאימים לגודל הזה. {candidates.length} מזגנים בקטלוג מפרסמים תפוקת קירור מדויקת,
          מתוכם {inStock} זמינים כרגע.
        </p>
      }
      answer="חדר של 16 מ״ר עם שני אנשים צריך כ־11,400 BTU — מזגן של 1.25 כ״ס. במקדם יעילות 3.5, בעומס ממוצע של 70% ו־8 שעות ביום, הוא יעלה כ־102 ₪ בחודש בתעריף החשמל הביתי (63.52 אג׳ לקוט״ש)."
      method={[
        {
          heading: "איך מחשבים גודל מזגן לחדר",
          paragraphs: [
            "כלל האצבע המקובל בשוק הישראלי: 650 BTU לכל מ״ר, ועוד 500 BTU לכל אדם שנמצא בחדר בדרך כלל. 1 כ״ס שווה בערך 9,000 BTU — מוסכמת שוק, לא תקן — ולכן חדר של 20 מ״ר עם שני אנשים צריך כ־14,000 BTU, כלומר מזגן של 1.5 כ״ס.",
            "מוסיפים דרגה כשהחדר בקומה עליונה מתחת לגג, כשיש בו חלונות גדולים לדרום או למערב, או כשהוא פתוח למטבח. בסלון עם תקרה גבוהה כדאי לחשב לפי נפח ולא רק לפי שטח — ולהתייעץ איתנו לפני שבוחרים.",
          ],
        },
        {
          heading: "איך מחשבים עלות הפעלה",
          paragraphs: [
            "תפוקת קירור ב־BTU מומרת לקילוואט (1 BTU = 0.293 וואט) ומחולקת במקדם היעילות (COP): מזגן של 12,000 BTU עם COP של 3.5 צורך כ־1 קילוואט בהספק מלא. מכפילים בעומס הממוצע, בשעות ההפעלה ובתעריף — 63.52 אגורות לקוט״ש כולל מע״מ.",
            "העלות ליד כל דגם ברשימה מחושבת לפי תפוקת הקירור שהיצרן פרסם עבורו ולפי ההנחות שהזנתם. מקדם היעילות של כל דגם מופיע בעמוד המוצר, ואם הוא גבוה מ־3.5 — העלות בפועל נמוכה יותר.",
          ],
        },
      ]}
      faq={FAQ}
    >
      <AcCostCalculator candidates={candidates} />
    </ToolPageLayout>
  );
}
