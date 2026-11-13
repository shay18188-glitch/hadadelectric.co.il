import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import type { RecommendationPick } from "@/content/recommendationPicks";
import { seoBrandName } from "@/lib/seo/brandNames";
import { shownModel, type Product } from "@/types/product";

export interface ResolvedPick {
  pick: RecommendationPick;
  product: Product;
}

/**
 * The editorial half of a recommendation page: a few in-stock models, each
 * matched to the situation it suits, with the trade-off stated next to the
 * advantage. The full filtered grid below stays the catalog view; this is the
 * part that answers "which one, for me".
 */
export function RecommendationPicks({
  picks,
  method,
  shortTitle,
}: {
  picks: ResolvedPick[];
  method: string;
  shortTitle: string;
}) {
  return (
    <section id="picks" className="container-page scroll-mt-28 pb-12 md:pb-16" aria-labelledby="picks-heading">
      <div className="max-w-3xl">
        <p className="section-kicker">הבחירות שלנו</p>
        <h2 id="picks-heading" className="section-title mt-3">
          {picks.length} {shortTitle} שבחרנו — ולמי כל אחד מתאים
        </h2>
        <p className="mt-4 text-sm leading-7 text-graphite-soft/72 md:text-base">{method}</p>
      </div>

      <ol className="mt-8 grid gap-5 md:grid-cols-2">
        {picks.map(({ pick, product }) => {
          const brand = seoBrandName(product.brand) ?? product.brand;
          const model = shownModel(product);
          const href = `/products/${encodeURIComponent(product.slug)}`;
          return (
            <li
              key={product.modelNumber}
              className="flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-[0_18px_45px_-40px_rgba(10,22,36,.55)]"
            >
              <div className="flex gap-4 p-5 md:p-6">
                <Link
                  href={href}
                  className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#f7f5f0,#eeece6)] md:h-28 md:w-28"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <ProductImage
                    src={product.imageUrl || "/images/product-placeholder-v2.webp"}
                    alt=""
                    fill
                    sizes="112px"
                    className={product.imageUrl ? "object-contain p-2" : "object-cover"}
                  />
                </Link>
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-brand-blue-light px-3 py-1 text-xs font-black text-brand-blue">
                    {pick.label}
                  </span>
                  <h3 className="mt-2 text-lg font-black leading-snug text-graphite">
                    <Link href={href} className="hover:text-brand-blue hover:underline">
                      {brand ? `${brand} ${model}` : model}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-graphite-soft/66">{product.name}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 border-t border-line/70 px-5 pb-5 pt-4 md:px-6 md:pb-6">
                <p className="text-sm leading-6 text-graphite">{pick.bestFor}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black text-success">יתרונות</p>
                    <ul className="mt-2 space-y-1.5 text-sm leading-6 text-graphite-soft/86">
                      {pick.pros.map((pro) => (
                        <li key={pro} className="flex gap-2">
                          <span aria-hidden="true" className="text-success">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {pick.cons.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-graphite-soft/70">שימו לב</p>
                      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-graphite-soft/86">
                        {pick.cons.map((con) => (
                          <li key={con} className="flex gap-2">
                            <span aria-hidden="true" className="text-graphite-soft/50">–</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Link href={href} className="mt-auto text-sm font-black text-brand-blue hover:underline">
                  למפרט המלא של {model} ←
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
