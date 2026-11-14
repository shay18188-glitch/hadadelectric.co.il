import type { PublishedResearch } from "@/lib/research/schema";
import { expandSpecRows, orderSpecGroups, productFamily, sortSpecRows } from "@/lib/productLayout";
import { BulletList, DetailRow, DetailRows, SpecTable, previewOf } from "@/components/ProductDetails";
import type { Locale } from "@/lib/i18n/locales";
import type { Product } from "@/types/product";

const TEXT: Record<Locale, {
  kicker: string;
  heading: (model: string) => string;
  hint: string;
  specs: string;
  capabilities: string;
  inTheBox: string;
  installation: string;
  more: string;
}> = {
  he: {
    kicker: "כל הפרטים",
    heading: (model) => `מפרט ומידע נוסף — ${model}`,
    hint: "הנתונים החשובים מופיעים בראש העמוד. כל השאר מקובץ כאן לפי נושא — לחצו על שורה כדי לפתוח אותה.",
    specs: "מפרט טכני מלא",
    capabilities: "יכולות ומאפיינים",
    inTheBox: "מה באריזה",
    installation: "התקנה ודרישות",
    more: "ועוד",
  },
  en: {
    kicker: "All the details",
    heading: (model) => `Specifications and more — ${model}`,
    hint: "The key figures are at the top of the page. Everything else is grouped here by topic — tap a row to open it.",
    specs: "Full technical specifications",
    capabilities: "Features",
    inTheBox: "In the box",
    installation: "Installation and requirements",
    more: "and more",
  },
  ru: {
    kicker: "Все подробности",
    heading: (model) => `Характеристики и подробности — ${model}`,
    hint: "Главные параметры — в начале страницы. Остальное сгруппировано здесь по темам — нажмите на строку, чтобы открыть.",
    specs: "Полные технические характеристики",
    capabilities: "Возможности",
    inTheBox: "Комплектация",
    installation: "Установка и требования",
    more: "и др.",
  },
};

/**
 * Everything below the buy column that is not decision-critical, as rows
 * that open on demand, ordered by what matters for this kind of product.
 *
 * `keyFactCount` is how many tiles the buy column could show. When it is
 * low the record is thin or unstructured, and the full sheet opens by
 * default rather than hiding the only facts there are.
 */
export function ProductMoreDetails({
  product,
  research,
  locale,
  modelNumber,
  keyFactCount,
}: {
  product: Product;
  research: PublishedResearch | null;
  locale: Locale;
  modelNumber: string;
  keyFactCount: number;
}) {
  const t = TEXT[locale];
  const family = productFamily(product);
  const thin = keyFactCount < 3;
  // Spec text comes from the Hebrew feed or research, whatever the page language.
  const hebrew = locale === "he" ? {} : ({ lang: "he", dir: "rtl" } as const);
  // A closed row's hint lists its Hebrew labels; on an English or Russian
  // page that is noise in the wrong script, so those pages show titles only.
  const hint = (items: string[], max?: number) => (locale === "he" ? previewOf(items, t.more, max) : undefined);

  const specRows = research && research.specGroups.length > 0
    ? orderSpecGroups(research.specGroups, family).map((group, index) => (
        <DetailRow
          key={group.id}
          id={`spec-${group.id}`}
          title={group.title}
          preview={hint(group.rows.map((r) => r.label))}
          defaultOpen={family.openGroups.includes(group.id) || (thin && index === 0)}
        >
          <SpecTable rows={group.rows} />
        </DetailRow>
      ))
    : product.specs.length > 0
      ? (() => {
          const rows = sortSpecRows(expandSpecRows(product.specs), family);
          return [
            <DetailRow
              key="specs"
              id="spec-all"
              title={t.specs}
              preview={hint(rows.map((r) => r.label || r.value))}
              defaultOpen={thin}
            >
              <div {...hebrew}>
                <SpecTable rows={rows} />
              </div>
            </DetailRow>,
          ];
        })()
      : [];

  const capabilities = product.capabilities.length > 0 && (
    <DetailRow key="capabilities" id="capabilities" title={t.capabilities} preview={hint(product.capabilities, 2)}>
      <div {...hebrew}>
        <BulletList items={product.capabilities} />
      </div>
    </DetailRow>
  );
  const inTheBox = research && research.inTheBox.length > 0 && (
    <DetailRow key="box" id="in-the-box" title={t.inTheBox} preview={hint(research.inTheBox)}>
      <BulletList items={research.inTheBox} />
    </DetailRow>
  );
  const installation = research && research.installation.length > 0 && (
    <DetailRow key="installation" id="installation" title={t.installation} preview={hint(research.installation, 2)}>
      <BulletList items={research.installation} />
    </DetailRow>
  );
  const extras = family.installFirst ? [installation, inTheBox, capabilities] : [capabilities, inTheBox, installation];
  const rows = [...specRows, ...extras.filter(Boolean)];
  if (rows.length === 0) return null;

  return (
    <section className="mt-12 md:mt-16" aria-labelledby="specs-heading">
      <p className="section-kicker">{t.kicker}</p>
      <h2 id="specs-heading" className="mt-2 text-2xl font-black text-graphite md:text-3xl">
        {t.heading(modelNumber)}
      </h2>
      <p className="mt-2 text-sm text-graphite-soft/70">{t.hint}</p>
      <DetailRows className="mt-5">{rows}</DetailRows>
    </section>
  );
}
