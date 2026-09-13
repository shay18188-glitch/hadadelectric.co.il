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
    // Suppliers write the same feature three ways — "No Frost", "NoFrost" and
    // "Total No Frost" all appear in the catalog. Left as written they read as
    // three different technologies in a comparison column, so they are folded
    // into one label; "Total" is kept because it names a different scope
    // (freezer and fridge, not freezer alone).
    label: "שיטת קירור",
    read: (t) => {
      const m = /\b(Total\s+No\s?Frost|No\s?Frost)\b/i.exec(t);
      if (!m) return null;
      return /total/i.test(m[1]) ? "Total No Frost" : "No Frost";
    },
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


/**
 * What actually separates these models, computed rather than asserted.
 *
 * A table lets a reader find the difference; this states it. It is also the
 * part an answer engine can lift verbatim, and it cannot drift from the table
 * above it because both are derived from the same rows.
 *
 * An attribute every model shares is reported too, and is often the more useful
 * sentence: knowing that all the 10 kg machines spin at 1400 rpm tells a buyer
 * to stop weighing spin speed and look at something else.
 */
export interface ComparisonInsight {
  label: string;
  text: string;
}

/** Leading number plus trailing unit, when a value is numeric. */
function numeric(value: string): { n: number; unit: string } | null {
  const m = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(value.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? { n, unit: m[2].trim() } : null;
}

function trim0(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

export function summariseComparison(table: ComparisonTable): ComparisonInsight[] {
  const out: ComparisonInsight[] = [];

  for (const attribute of table.attributes) {
    const values = table.rows
      .map((row) => row.values[attribute.key])
      .filter((v): v is string => Boolean(v));
    if (values.length < 2) continue;

    const distinct = [...new Set(values)];
    if (distinct.length === 1) {
      out.push({ label: attribute.label, text: `כל הדגמים — ${distinct[0]}` });
      continue;
    }

    // A range is only honest for a spread that is actually continuous. Refresh
    // rate takes two values, 60 and 120, and "60 עד 120Hz" invites a reader to
    // imagine a 90Hz model that does not exist; depth genuinely runs 55, 59,
    // 60, 64. So a small discrete set is listed and a wider spread is ranged.
    const nums = values.map(numeric);
    if (nums.every((x): x is { n: number; unit: string } => x !== null)) {
      const unit = nums[0].unit;
      if (nums.every((x) => x.unit === unit) && distinct.length > 3) {
        const lo = Math.min(...nums.map((x) => x.n));
        const hi = Math.max(...nums.map((x) => x.n));
        out.push({ label: attribute.label, text: `${trim0(lo)} עד ${trim0(hi)} ${unit}`.trim() });
        continue;
      }
    }

    const counts = distinct
      .map((value) => ({ value, n: values.filter((v) => v === value).length }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 3);
    out.push({
      label: attribute.label,
      text: counts.map((c) => `${c.value} (${c.n})`).join(" · "),
    });
  }

  return out;
}
