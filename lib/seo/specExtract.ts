import type { Product } from "@/types/product";

/**
 * Pulls the few attributes a buyer actually compares out of the supplier spec
 * sheet.
 *
 * The recommendation pages already carry real editorial copy, yet they sit at
 * position 37 and hand Google nothing a price-comparison site does not have.
 * What this shop has and they do not is the spec sheet for the models actually
 * on the shelf — so the missing piece is a side-by-side of those models.
 *
 * An earlier attempt was abandoned on the grounds that label coverage was too
 * thin: only 6 of 18 televisions carry a "סוג פאנל" label. That measured the
 * wrong thing twice. It counted every model rather than the in-stock ones a
 * visitor can buy, and it counted *labels* rather than information — several
 * suppliers ship the whole sheet as one unlabelled blob that still states the
 * panel type in plain text. Matching the text instead of the label, across the
 * in-stock subset, the attributes below are present for most models.
 *
 * The discipline is the one the dimensions parser uses: a value is returned
 * only when the sheet states it. Nothing is inferred from a model number, a
 * category norm, or a sibling product, and an attribute nobody publishes simply
 * renders as a dash.
 */

export interface SpecAttribute {
  key: string;
  label: string;
  /** Reads the combined spec text; returns null when the sheet is silent. */
  read: (text: string, product: Product) => string | null;
}

function specText(product: Product): string {
  return product.specs.map((s) => (s.label ? `${s.label}: ${s.value}` : s.value)).join(" | ");
}

function first(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m ? (m[1] ?? m[0]).trim() : null;
}

/** Energy grade, taking the new-scale reading when a sheet quotes both. */
function energyGrade(text: string): string | null {
  const m = /דירוג\s*(?:יעילות\s*)?(?:אנרגט\w*|צריכת\s*חשמל)\s*:?\s*([A-G])(\+*)/i.exec(text);
  if (!m) return null;
  // A "+" suffix is the pre-2021 scale, which is not comparable with a bare
  // letter from the new one; report it as-is rather than silently equating them.
  return m[2] ? `${m[1].toUpperCase()}${m[2]} (תקן ישן)` : m[1].toUpperCase();
}

const TV_ATTRIBUTES: SpecAttribute[] = [
  {
    key: "panel",
    label: "סוג פאנל",
    read: (t) => first(t, /\b(OLED|QNED|QLED|NanoCell|Nano|Mini\s?LED|Direct\s?LED|LED\s*\/\s*IPS|LED)\b/i),
  },
  {
    key: "refresh",
    label: "קצב רענון",
    read: (t) => {
      const v = first(t, /(\d{2,3})\s*Hz/i);
      return v ? `${v}Hz` : null;
    },
  },
  {
    key: "os",
    label: "מערכת הפעלה",
    read: (t) => first(t, /\b(webOS(?:\s*\d+)?|Google\s?TV|Android\s?TV|Tizen|VIDAA)\b/i),
  },
  {
    key: "hdmi",
    label: "כניסות HDMI",
    read: (t) => first(t, /(\d)\s*(?:כניסות\s*)?(?:x\s*)?HDMI/i) ?? first(t, /HDMI\s*[:\s]\s*(\d)/i),
  },
];

const WASHER_ATTRIBUTES: SpecAttribute[] = [
  {
    key: "spin",
    label: "סחיטה",
    read: (t) => {
      const v = first(t, /(\d{3,4})\s*סל["״']?ד/);
      return v ? `${v} סל״ד` : null;
    },
  },
  { key: "energy", label: "דירוג אנרגטי", read: (t) => energyGrade(t) },
  {
    key: "depth",
    label: "עומק",
    read: (t) => {
      const v = first(t, /עומק\s*:?\s*(\d{2}(?:\.\d)?)\s*ס["״']?מ/);
      return v ? `${v} ס״מ` : null;
    },
  },
  {
    key: "motor",
    label: "מנוע",
    read: (t) => first(t, /\b(Digital\s+Inverter(?:\s+BLDC)?|Inverter|אינוורטר)\b/i),
  },
];

const FRIDGE_ATTRIBUTES: SpecAttribute[] = [
  {
    key: "volume",
    label: "נפח",
    // The product name wins over the spec sheet here, deliberately. A sheet can
    // quote gross, net and "total" as three different figures — EQE5600BB lists
    // 634 gross and 564 net while its own title says 572 — and a table that
    // contradicts the title beside it destroys the trust the table exists to
    // build. The name is the figure shown everywhere else on the site.
    read: (t, p) => {
      const v = first(p.name, /(\d{3,4})\s*ליטר/) ?? first(t, /נפח\s*(?:כולל|כללי)?\s*(?:נטו)?\s*:?\s*(\d{3,4})\s*ליטר/);
      return v ? `${v} ליטר` : null;
    },
  },
  {
    key: "width",
    label: "רוחב",
    read: (t) => {
      const v = first(t, /רוחב\s*:?\s*(\d{2}(?:\.\d)?)\s*ס["״']?מ/);
      return v ? `${v} ס״מ` : null;
    },
  },
  { key: "energy", label: "דירוג אנרגטי", read: (t) => energyGrade(t) },
  {
    key: "cooling",
    label: "שיטת קירור",
    read: (t) => first(t, /\b((?:Total\s+)?No\s?Frost|NoFrost)\b/i),
  },
];

const BY_CATEGORY: Record<string, SpecAttribute[]> = {
  tvs: TV_ATTRIBUTES,
  "washing-machines": WASHER_ATTRIBUTES,
  refrigerators: FRIDGE_ATTRIBUTES,
};

export interface ComparisonRow {
  slug: string;
  name: string;
  brand: string | null;
  modelNumber: string;
  values: Record<string, string | null>;
  /** How many of the requested attributes this sheet actually states. */
  filled: number;
}

export interface ComparisonTable {
  attributes: SpecAttribute[];
  rows: ComparisonRow[];
}

/**
 * Builds the table for a set of products, keeping only attributes that at least
 * half the rows publish — a column of dashes compares nothing.
 */
export function buildComparison(categorySlug: string | null, products: Product[]): ComparisonTable | null {
  const attributes = categorySlug ? BY_CATEGORY[categorySlug] : undefined;
  if (!attributes || products.length < 2) return null;

  const rows: ComparisonRow[] = products.map((product) => {
    const text = `${specText(product)} | ${product.capabilities.join(" | ")}`;
    const values: Record<string, string | null> = {};
    for (const attribute of attributes) values[attribute.key] = attribute.read(text, product);
    return {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      modelNumber: product.modelNumber,
      values,
      filled: Object.values(values).filter(Boolean).length,
    };
  });

  const kept = attributes.filter(
    (attribute) => rows.filter((row) => row.values[attribute.key]).length >= Math.ceil(rows.length / 2)
  );
  if (kept.length === 0) return null;

  return {
    attributes: kept,
    rows: rows.filter((row) => kept.some((attribute) => row.values[attribute.key])),
  };
}
