import Link from "next/link";
import { summariseComparison, type ComparisonTable } from "@/lib/seo/specExtract";

/**
 * The models on the shelf, side by side.
 *
 * Cards let a reader compare two products at a time; a table lets them compare
 * the whole shortlist on the one attribute they care about — which is the
 * question these pages exist to answer. Every value comes from the supplier's
 * own sheet, and an attribute a sheet does not state renders as a dash rather
 * than being filled in from a category norm.
 *
 * Phones get stacked cards. A five-column table at 375px pushes the columns
 * that carry the comparison off-screen behind a horizontal scroll, which is the
 * same mistake the niche calculator made before it was fixed.
 */
export function SpecComparisonTable({
  table,
  caption,
}: {
  table: ComparisonTable;
  caption: string;
}) {
  const { attributes, rows } = table;
  const insights = summariseComparison(table);

  return (
    <figure className="my-8 md:my-10">
      {insights.length > 0 && (
        <div className="mb-4 rounded-[1.25rem] border border-line/75 bg-surface p-4 md:p-5">
          <p className="text-sm font-bold text-graphite">מה באמת מבדיל בין הדגמים</p>
          <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 md:text-sm">
            {insights.map((insight) => (
              <div key={insight.label} className="flex flex-wrap gap-x-2">
                <dt className="text-graphite-soft/60">{insight.label}:</dt>
                <dd className="m-0 font-medium text-graphite">{insight.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <div className="hidden overflow-x-auto rounded-[1.25rem] border border-line/75 bg-white sm:block">
        <table className="w-full text-[13px] md:text-sm">
          <thead>
            <tr className="bg-surface text-xs text-graphite-soft/80">
              <th scope="col" className="p-3 text-right font-semibold">
                דגם
              </th>
              {attributes.map((attribute) => (
                <th key={attribute.key} scope="col" className="p-3 text-right font-semibold whitespace-nowrap">
                  {attribute.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug} className="border-t border-line align-top">
                <th scope="row" className="p-3 text-right font-medium">
                  <Link href={`/products/${row.slug}`} className="text-graphite hover:text-brand-blue">
                    {row.name}
                  </Link>
                  <span className="mt-0.5 block text-xs font-normal text-graphite-soft/60">
                    {row.brand ? `${row.brand} · ` : ""}
                    {row.modelNumber}
                  </span>
                </th>
                {attributes.map((attribute) => (
                  <td key={attribute.key} className="p-3 text-graphite-soft/85">
                    {row.values[attribute.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 sm:hidden">
        {rows.map((row) => (
          <li key={row.slug} className="rounded-2xl border border-line bg-white p-4">
            <Link href={`/products/${row.slug}`} className="text-sm font-semibold text-graphite hover:text-brand-blue">
              {row.name}
            </Link>
            <p className="mt-0.5 text-xs text-graphite-soft/60">
              {row.brand ? `${row.brand} · ` : ""}
              {row.modelNumber}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
              {attributes.map((attribute) => (
                <div key={attribute.key} className="contents">
                  <dt className="text-graphite-soft/60">{attribute.label}</dt>
                  <dd className="m-0 text-graphite-soft/85">{row.values[attribute.key] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <figcaption className="mt-3 text-xs leading-relaxed text-graphite-soft/60">
        {caption} מוצג רק מה שגיליון המפרט של היצרן או היבואן מציין במפורש; מקף פירושו שהנתון לא
        פורסם, ולא שהתכונה חסרה. לפני הזמנה תמיד כדאי לאמת מול הדגם הסופי.
      </figcaption>
    </figure>
  );
}
