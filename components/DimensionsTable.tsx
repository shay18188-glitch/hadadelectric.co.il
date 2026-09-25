import Link from "next/link";
import { formatDimensions } from "@/lib/seo/dimensions";
import type { DimensionsColumn, DimensionsTable as TableData, MeasuredProduct } from "@/lib/seo/catalogDimensions";
import { LOCALE_PREFIX, type Locale } from "@/lib/i18n/locales";

/**
 * Labels per locale. The table used to be Hebrew-only, so the Russian and
 * English editions of every measured guide rendered their prose and dropped the
 * table entirely — which is the part the page exists for. /ru/guides/tv-65-inch-
 * dimensions took 6,208 impressions in 28 days without it.
 */
const TEXT: Record<Locale, {
  model: string;
  column: Record<DimensionsColumn, string>;
  cm: string;
  width: string;
  depth: string;
  height: string;
  footnote: (shown: number, matched: number) => string;
}> = {
  he: {
    model: "דגם",
    column: {
      body: "מידות המוצר (ר × ג × ע)",
      withStand: "כולל מעמד (ר × ג × ע)",
      vesa: "תקן תלייה VESA",
      cutout: "מידת חיתוך / נישה",
    },
    cm: "ס״מ",
    width: "רוחב",
    depth: "עומק",
    height: "גובה",
    footnote: (shown, matched) =>
      `${shown} דגמים מתוך ${matched} שנמצאים בקטלוג בקטגוריה הזו. המידות מגיעות מגיליון המפרט של היצרן או היבואן כפי שהוא מופיע ברשומת המוצר; דגמים שלא פורסמה עבורם מידה מדויקת אינם מופיעים בטבלה. מומלץ לאמת מול הדגם המדויק לפני חיתוך שיש, הזמנת נגרות או תלייה על הקיר.`,
  },
  ru: {
    model: "Модель",
    column: {
      body: "Корпус (Ш × В × Г)",
      withStand: "С подставкой (Ш × В × Г)",
      vesa: "Крепление VESA",
      cutout: "Вырез / ниша",
    },
    cm: "см",
    width: "ширина",
    depth: "глубина",
    height: "высота",
    footnote: (shown, matched) =>
      `${shown} моделей из ${matched}, которые есть в нашем каталоге в этой категории. Размеры взяты из технического паспорта производителя или импортёра, как он указан в карточке товара; модели без точных опубликованных размеров в таблицу не включены. Перед покупкой тумбы, заказом мебели или креплением на стену сверьтесь с конкретной моделью.`,
  },
  en: {
    model: "Model",
    column: {
      body: "Body (W × H × D)",
      withStand: "With stand (W × H × D)",
      vesa: "VESA mount",
      cutout: "Cut-out / niche",
    },
    cm: "cm",
    width: "width",
    depth: "depth",
    height: "height",
    footnote: (shown, matched) =>
      `${shown} of the ${matched} models in our catalog in this category. Dimensions come from the manufacturer's or importer's spec sheet as listed on the product record; models without a published exact measurement are left out. Check the exact model before cutting a worktop, ordering joinery or wall-mounting.`,
  },
};

function formatBox(d: { widthCm: number; heightCm: number; depthCm: number }, cm: string, decimal: string): string {
  const r = (n: number) => String(Math.round(n * 10) / 10).replace(".", decimal);
  return `${r(d.widthCm)} × ${r(d.heightCm)} × ${r(d.depthCm)} ${cm}`;
}

/** "רוחב 56 ס״מ · עומק 48 ס״מ" — only the axes the supplier actually published. */
function formatCutout(cutout: MeasuredProduct["cutout"], t: (typeof TEXT)[Locale]): string {
  if (!cutout) return "—";
  const parts = [
    cutout.widthText ? `${t.width} ${cutout.widthText}` : null,
    cutout.depthText ? `${t.depth} ${cutout.depthText}` : null,
    cutout.heightText ? `${t.height} ${cutout.heightText}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

/**
 * A measured table, not an illustrative one.
 *
 * Every row is a model in the live catalog and every number comes from that
 * model's spec sheet. The footnote says so explicitly, because the reason this
 * page can outrank a national retailer on "מידות טלוויזיה 65 אינץ" is that the
 * retailer publishes a generic paragraph and this publishes measurements.
 */
export function DimensionsTable({
  table,
  columns,
  caption,
  locale = "he",
}: {
  table: TableData;
  columns: DimensionsColumn[];
  caption: string;
  locale?: Locale;
}) {
  if (table.rows.length === 0) return null;
  const t = TEXT[locale];
  const decimal = locale === "ru" ? "," : ".";
  const productPrefix = `${LOCALE_PREFIX[locale]}/products/`;

  return (
    <figure className="my-8 md:my-10">
      <figcaption className="mb-3 text-sm font-bold text-graphite">{caption}</figcaption>
      <div className="overflow-x-auto rounded-[1.25rem] border border-line/75 bg-white">
        <table className="w-full min-w-[34rem] text-[13px] md:text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/70 text-graphite-soft/72">
              <th scope="col" className="px-3 py-2.5 text-start font-bold md:px-4 md:py-3">
                {t.model}
              </th>
              {columns.map((column) => (
                <th key={column} scope="col" className="whitespace-nowrap px-3 py-2.5 text-start font-bold md:px-4 md:py-3">
                  {t.column[column]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={row.slug} className={index % 2 === 0 ? "bg-white" : "bg-surface/45"}>
                <th scope="row" className="px-3 py-2.5 text-start font-medium md:px-4 md:py-3">
                  <Link href={`${productPrefix}${row.slug}`} className="text-graphite hover:text-brand-blue hover:underline">
                    {row.brand ? `${row.brand} ` : ""}
                    {row.modelNumber}
                  </Link>
                </th>
                {columns.map((column) => (
                  <td
                    key={column}
                    className="whitespace-nowrap px-3 py-2.5 text-graphite-soft/85 md:px-4 md:py-3"
                    // Only the purely numeric columns are LTR. The cut-out cell
                    // is Hebrew ("רוחב 56 ס״מ · עומק 48 ס״מ"), and forcing LTR
                    // there reverses the visual order of the two measurements.
                    dir={column === "cutout" ? undefined : "ltr"}
                  >
                    {column === "vesa"
                      ? (row.vesa ?? "—")
                      : column === "cutout"
                        ? formatCutout(row.cutout, t)
                        : row[column]
                          ? locale === "he"
                            ? formatDimensions(row[column]!)
                            : formatBox(row[column]!, t.cm, decimal)
                          : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-5 text-graphite-soft/58">
        {t.footnote(table.rows.length, table.matched)}
      </p>
    </figure>
  );
}
