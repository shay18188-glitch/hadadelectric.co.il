import type { Metadata } from "next";
import { FridgeCostCalculator } from "@/components/energy/FridgeCostCalculator";
import { ToolPageLayout } from "@/components/energy/ToolPageLayout";
import { energyToolByPath } from "@/content/energyTools";
import { getFridgeCandidates } from "@/lib/energy/catalogEnergy";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * The refrigerator is the one appliance that runs all year, so its label kWh
 * is the number most worth turning into shekels. The page costs the reader's
 * current fridge and every catalog model that publishes the figure.
 */

export const revalidate = 10800; // 3 hours

const PATH = "/tools/refrigerator-electricity";

export const metadata: Metadata = buildMetadata({
  title: "כמה חשמל צורך מקרר — מחשבון עלות וחיסכון בהחלפה",
  absoluteTitle: true,
  description:
    "כמה עולה להפעיל את המקרר שלכם בחודש ובשנה, וכמה תחסכו בהחלפה — השוואה מול כל מקרר בקטלוג לפי הצריכה השנתית שבתווית האנרגיה, בתעריף 2026.",
  path: PATH,
});

const FAQ = [
  {
    question: "כמה חשמל צורך מקרר ממוצע?",
    answer:
      "מקרר חדש בנפח משפחתי צורך בדרך כלל 230–370 קוט״ש בשנה — זה הטווח של רוב הדגמים בקטלוג שלנו שמפרסמים את הנתון. בתעריף של 63.52 אג׳ לקוט״ש זה 146–235 ₪ בשנה. מקרר ישן וגדול צורך לא פעם פי שניים.",
  },
  {
    question: "כמה עולה להפעיל מקרר בחודש?",
    answer:
      "צריכה שנתית חלקי 12, כפול התעריף. מקרר של 300 קוט״ש בשנה צורך 25 קוט״ש בחודש — כ־15.90 ₪. מקרר ישן של 600 קוט״ש בשנה עולה כ־31.80 ₪ בחודש.",
  },
  {
    question: "שווה להחליף מקרר ישן רק בגלל החשמל?",
    answer:
      "החשמל לבדו לרוב לא מצדיק החלפה של מקרר תקין, אבל הוא מקזז חלק ניכר מהמחיר. החלפה של מקרר שצורך 600 קוט״ש בשנה בדגם של 255 חוסכת כ־219 ₪ בשנה — כ־2,600 ₪ על פני 12 שנה. אם המקרר בן 12 שנה ומעלה ומתחיל להציק — החיסכון הופך את ההחלטה לקלה.",
  },
  {
    question: "איפה מוצאים את הצריכה השנתית של מקרר?",
    answer:
      "בתווית האנרגיה, מתחת לאות הדירוג, במספר שליד kWh/annum. במקרר ישן יש לרוב מדבקה בתוך תא הקירור. בקטלוג שלנו הנתון מופיע במפרט של כל דגם שהיצרן פרסם עבורו.",
  },
  {
    question: "למה מקרר בדירוג E יכול לצרוך פחות ממקרר בדירוג D?",
    answer:
      "כי הדירוג יחסי לנפח ולסוג המקרר. מקרר גדול בדירוג E יכול לצרוך יותר בקוט״ש ממקרר קטן בדירוג D, ולהפך. לכן משווים את המספר השנתי, לא את האות.",
  },
];

export default async function Page() {
  const tool = energyToolByPath(PATH)!;
  const candidates = await getFridgeCandidates();
  const fridges = candidates.filter((c) => c.categorySlug === "refrigerators");

  return (
    <ToolPageLayout
      tool={tool}
      heading="כמה עולה להפעיל את המקרר שלכם, וכמה תחסכו בהחלפה?"
      intro={
        <p>
          הזינו את הצריכה השנתית של המקרר הנוכחי (מהתווית) וקבלו כמה הוא עולה בשנה — ולצד זה את העלות השנתית
          של כל אחד מ־{fridges.length} המקררים בקטלוג שלנו שהיצרן פרסם עבורם צריכה שנתית, ואת החיסכון מול כל
          אחד מהם.
        </p>
      }
      answer="מקרר שצורך 300 קוט״ש בשנה עולה כ־190 ₪ בשנה (15.90 ₪ בחודש) בתעריף 63.52 אג׳ לקוט״ש. מקרר ישן של 600 קוט״ש עולה כ־381 ₪ בשנה — והחלפה בדגם של 255 קוט״ש חוסכת כ־219 ₪ בשנה."
      method={[
        {
          heading: "איך מחשבים עלות חשמל של מקרר",
          paragraphs: [
            "הדרך המדויקת היא לא וואט כפול 24 שעות — המדחס עובד לסירוגין, ומכפלה כזאת מגזימה פי שניים ויותר. משתמשים בצריכה השנתית שבתווית האנרגיה (קוט״ש לשנה), שנמדדה בתנאים אחידים, ומכפילים בתעריף: 300 קוט״ש × 0.6352 ₪ = 190.56 ₪ בשנה.",
            "בפועל המקרר צורך מעט יותר בקיץ, במטבח חם, כשהוא צמוד לתנור או כשפותחים אותו הרבה, ומעט פחות בחורף. גומיות אטימה שחוקות ומעבה מאובק מעלים את הצריכה של מקרר ישן מעבר למה שהתווית המקורית שלו אומרת.",
          ],
        },
        {
          heading: "מאיפה המספרים ברשימה",
          paragraphs: [
            "מגיליון המפרט של היצרן או היבואן, כפי שהוא מופיע בעמוד המוצר בקטלוג. דגם שלא פורסמה עבורו צריכה שנתית מפורשת לא מופיע ברשימה — אנחנו לא משלימים ולא מעריכים. נתון שפורסם ליממה הוכפל ב־365.",
          ],
        },
      ]}
      faq={FAQ}
    >
      <FridgeCostCalculator candidates={candidates} />
    </ToolPageLayout>
  );
}
