import { screenGeometry, oneDecimal } from "@/lib/seo/screenGeometry";
import type { Locale } from "@/lib/i18n/locales";

const TEXT: Record<Locale, { caption: string; size: string; diagonal: string; width: string; height: string; note: string; decimal: "," | "." }> = {
  he: {
    caption: "מידות מסך לפי גודל — אלכסון, רוחב וגובה בס״מ",
    size: "גודל",
    diagonal: "אלכסון",
    width: "רוחב",
    height: "גובה",
    note: "חישוב גאומטרי למסך ביחס 16:9, ללא מסגרת. מסגרת ומעמד מוסיפים עוד — ראו את הטבלה המדודה לפי דגם.",
    decimal: ".",
  },
  ru: {
    caption: "Размеры экрана по диагонали — ширина и высота в сантиметрах",
    size: "Диагональ",
    diagonal: "в см",
    width: "Ширина",
    height: "Высота",
    note: "Геометрический расчёт для экрана 16:9 без рамки. Рамка и подставка добавляют ещё — точные размеры по моделям в таблице ниже.",
    decimal: ",",
  },
  en: {
    caption: "Screen size by diagonal — width and height in centimetres",
    size: "Size",
    diagonal: "Diagonal",
    width: "Width",
    height: "Height",
    note: "Geometry for a 16:9 panel without its frame. The frame and stand add more — see the measured table by model below.",
    decimal: ".",
  },
};

/**
 * Inches to centimetres for the common sizes, with width and height.
 *
 * Every other result for "65 дюймов в см" gives the diagonal and stops. The
 * width is the number that decides whether a set fits a wall or a TV unit, so
 * the table leads with it, and the requested size is highlighted so a reader
 * who arrived for one number finds it immediately.
 */
export function ScreenSizeTable({
  sizes,
  highlight,
  locale = "he",
}: {
  sizes: number[];
  highlight?: number;
  locale?: Locale;
}) {
  const t = TEXT[locale];
  const fmt = (n: number) => oneDecimal(n).replace(".", t.decimal);
  const cm = locale === "he" ? "ס״מ" : locale === "ru" ? "см" : "cm";
  // Russian nouns agree with the number: 43 дюйма, 50 дюймов, 21 дюйм. A fixed
  // "дюймов" printed "43 дюймов", which a native reader stops on.
  const inch = (n: number) => {
    if (locale === "he") return "אינץ׳";
    if (locale === "en") return "in";
    const d = n % 10;
    const h = n % 100;
    if (d === 1 && h !== 11) return "дюйм";
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return "дюйма";
    return "дюймов";
  };

  return (
    <figure className="my-8 md:my-10">
      <figcaption className="mb-3 text-sm font-bold text-graphite">{t.caption}</figcaption>
      <div className="overflow-x-auto rounded-[1.25rem] border border-line/75 bg-white">
        <table className="w-full text-[13px] md:text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/70 text-graphite-soft/72">
              <th scope="col" className="whitespace-nowrap px-2 py-2.5 sm:px-3 text-start font-bold md:px-4">{t.size}</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5 sm:px-3 text-start font-bold md:px-4">{t.diagonal}</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5 sm:px-3 text-start font-bold md:px-4">{t.width}</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5 sm:px-3 text-start font-bold md:px-4">{t.height}</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((inches) => {
              const g = screenGeometry(inches);
              const on = inches === highlight;
              return (
                <tr key={inches} className={on ? "bg-brand-blue-light font-semibold text-graphite" : "odd:bg-white even:bg-surface/45"}>
                  <th scope="row" className="whitespace-nowrap px-2 py-2.5 sm:px-3 text-start md:px-4" dir="ltr">
                    {inches} {inch(inches)}
                  </th>
                  <td className="whitespace-nowrap px-2 py-2.5 sm:px-3 md:px-4" dir="ltr">{fmt(g.diagonalCm)} {cm}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 sm:px-3 md:px-4" dir="ltr">{fmt(g.widthCm)} {cm}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 sm:px-3 md:px-4" dir="ltr">{fmt(g.heightCm)} {cm}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-5 text-graphite-soft/58">{t.note}</p>
    </figure>
  );
}
