import Link from "next/link";
import { formatDimensions } from "@/lib/seo/dimensions";
import type { DimensionsColumn, DimensionsTable as TableData, MeasuredProduct } from "@/lib/seo/catalogDimensions";

const COLUMN_LABEL = {
  body: "מידות המוצר (ר × ג × ע)",
  withStand: "כולל מעמד (ר × ג × ע)",
  vesa: "תקן תלייה VESA",
  cutout: "מידת חיתוך / נישה",
} as const;

/** "רוחב 56 ס״מ · עומק 48 ס״מ" — only the axes the supplier actually published. */
function formatCutout(cutout: MeasuredProduct["cutout"]): string {
  if (!cutout) return "—";
  const parts = [
    cutout.widthText ? `רוחב ${cutout.widthText}` : null,
    cutout.depthText ? `עומק ${cutout.depthText}` : null,
    cutout.heightText ? `גובה ${cutout.heightText}` : null,
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
}: {
  table: TableData;
  columns: DimensionsColumn[];
  caption: string;
}) {
  if (table.rows.length === 0) return null;

  return (
    <figure className="my-8 md:my-10">
      <figcaption className="mb-3 text-sm font-bold text-graphite">{caption}</figcaption>
      <div className="overflow-x-auto rounded-[1.25rem] border border-line/75 bg-white">
        <table className="w-full min-w-[34rem] text-[13px] md:text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/70 text-graphite-soft/72">
              <th scope="col" className="px-3 py-2.5 text-start font-bold md:px-4 md:py-3">
                דגם
              </th>
              {columns.map((column) => (
                <th key={column} scope="col" className="whitespace-nowrap px-3 py-2.5 text-start font-bold md:px-4 md:py-3">
                  {COLUMN_LABEL[column]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={row.slug} className={index % 2 === 0 ? "bg-white" : "bg-surface/45"}>
                <th scope="row" className="px-3 py-2.5 text-start font-medium md:px-4 md:py-3">
                  <Link href={`/products/${row.slug}`} className="text-graphite hover:text-brand-blue hover:underline">
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
                        ? formatCutout(row.cutout)
                        : row[column]
                          ? formatDimensions(row[column]!)
                          : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-5 text-graphite-soft/58">
        {table.rows.length} דגמים מתוך {table.matched} שנמצאים בקטלוג בקטגוריה הזו. המידות מגיעות מגיליון המפרט של היצרן או
        היבואן כפי שהוא מופיע ברשומת המוצר; דגמים שלא פורסמה עבורם מידה מדויקת אינם מופיעים בטבלה. מומלץ לאמת מול הדגם
        המדויק לפני חיתוך שיש, הזמנת נגרות או תלייה על הקיר.
      </p>
    </figure>
  );
}
