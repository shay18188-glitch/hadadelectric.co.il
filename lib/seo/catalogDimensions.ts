import "server-only";

import { getProducts } from "@/lib/base44/catalog";
import { extractDimensions, panelSizeFromName, type CutoutDimensions, type Dimensions } from "@/lib/seo/dimensions";
import { seoBrandName } from "@/lib/seo/brandNames";
import type { Product } from "@/types/product";

/**
 * Turns the catalog into the measured tables that the "מידות" guides publish.
 *
 * The whole point of these pages is that the numbers are real. Nothing here
 * estimates, rounds to a category norm, or fills a gap — a product without a
 * parseable measurement is simply absent from the table, and the page says how
 * many models it is reporting so a reader can see the sample for what it is.
 */

export interface MeasuredProduct {
  slug: string;
  name: string;
  brand: string | null;
  modelNumber: string;
  body: Dimensions | null;
  withStand: Dimensions | null;
  vesa: string | null;
  cutout: CutoutDimensions | null;
  availability: Product["availability"];
}

/** Rebuilds the spec blob the parser expects from the normalized spec pairs. */
function specsText(product: Product): string {
  return product.specs.map((spec) => (spec.label ? `${spec.label}: ${spec.value}` : spec.value)).join("; ");
}

export function measure(product: Product): MeasuredProduct | null {
  // Screen geometry is the only independent check available, so it is passed
  // for display categories and withheld everywhere else.
  const isDisplay = product.categorySlug === "tvs" || product.categorySlug === "monitors";
  const dimensions = extractDimensions(specsText(product), {
    panelSize: isDisplay ? panelSizeFromName(product.name) : null,
  });
  if (!dimensions || (!dimensions.primary && !dimensions.withStand)) return null;

  // A display sheet that publishes a single set of dimensions sometimes labels
  // it as "with stand" when it is plainly the bare panel. UE65M70H is the case
  // that exposed it: 144 × 83.1 × 7.7 cm "with stand" and no body figure at
  // all — yet 7.7 cm is the depth of a 65-inch panel, and no stand that can hold
  // one upright is that shallow; every genuine stand reading in the category
  // falls between 22 and 35 cm. Left alone it put a body measurement in the
  // stand column and widened the published stand-depth range to "7.7–34.5",
  // contradicting the guide's own prose. A display reading under 15 cm deep with
  // no separate body figure is therefore treated as the body.
  let body = dimensions.primary;
  let withStand = dimensions.withStand;
  if (isDisplay && !body && withStand && withStand.depthCm < 15) {
    body = withStand;
    withStand = null;
  }

  return {
    slug: product.slug,
    name: product.name,
    brand: seoBrandName(product.brand),
    modelNumber: product.modelNumber,
    body,
    withStand,
    vesa: dimensions.vesa,
    cutout: dimensions.cutout,
    availability: product.availability,
  };
}

export type DimensionsColumn = "body" | "withStand" | "vesa" | "cutout";

export interface DimensionsTableSpec {
  categorySlug: string;
  /**
   * Narrows to a screen size, e.g. 65 for 65-inch televisions. Matched against
   * the inch marker in the product name rather than as a bare substring, so a
   * model number that happens to contain "65" cannot pull a 55-inch set in.
   */
  screenInches?: number;
  /**
   * Excludes models above this height. Used to keep freestanding ranges out of
   * a built-in oven table: both live in the "תנורים" category, but a 85 cm
   * range answers a different question than a 59.5 cm built-in and its
   * presence makes the stated ranges wrong.
   */
  maxHeightCm?: number;
  /**
   * Narrows to a model type within the category, as a RegExp source matched
   * against the product name — "4 דלתות" for a four-door fridge table,
   * "אינטגרלי" for built-under dishwashers. Kept as a string because these
   * specs live in content, which must stay serialisable.
   *
   * It exists because the interesting dimension question is usually about a
   * type, not a category: a four-door fridge is 79–91 cm wide while the
   * category as a whole starts at 43 cm, and quoting the category range would
   * answer nobody's question.
   */
  namePattern?: string;
  /** Which measured columns this table publishes. */
  columns: DimensionsColumn[];
}

export interface DimensionsTable {
  rows: MeasuredProduct[];
  /** How many catalog products matched the filter, measured or not. */
  matched: number;
  /** Extremes across the measured rows, for the summary sentence. */
  widthRange: [number, number] | null;
  heightRange: [number, number] | null;
}

function range(values: number[]): [number, number] | null {
  if (values.length === 0) return null;
  return [Math.min(...values), Math.max(...values)];
}

export async function buildDimensionsTable(spec: DimensionsTableSpec): Promise<DimensionsTable> {
  const products = await getProducts();
  const namePattern = spec.namePattern ? new RegExp(spec.namePattern) : null;
  const matching = products.filter((product) => {
    if (product.categorySlug !== spec.categorySlug) return false;
    if (namePattern && !namePattern.test(product.name)) return false;
    if (spec.screenInches && panelSizeFromName(product.name) === null) return false;
    if (spec.screenInches && !new RegExp(`(^|[^\\d])${spec.screenInches}\\s*['\u05f3"\u05f4]`).test(product.name))
      return false;
    if (spec.maxHeightCm) {
      const measured = measure(product);
      const height = measured?.body?.heightCm ?? measured?.withStand?.heightCm ?? null;
      if (height !== null && height > spec.maxHeightCm) return false;
    }
    return true;
  });

  const rows = matching
    .map(measure)
    .filter((row): row is MeasuredProduct => row !== null)
    .filter((row) =>
      spec.columns.some((column) =>
        column === "vesa" ? row.vesa : column === "cutout" ? row.cutout : row[column]
      )
    )
    .sort((a, b) => (a.brand ?? "").localeCompare(b.brand ?? "") || a.modelNumber.localeCompare(b.modelNumber));

  const bodies = rows.map((row) => row.body).filter((body): body is Dimensions => body !== null);

  return {
    rows,
    matched: matching.length,
    widthRange: range(bodies.map((body) => body.widthCm)),
    heightRange: range(bodies.map((body) => body.heightCm)),
  };
}

/**
 * The models the niche calculator can reason about.
 *
 * Restricted to the categories where "will it fit the gap" is the actual
 * buying question — the large freestanding and built-in appliances. Televisions
 * are excluded on purpose: their constraint is a wall or a console, not a
 * niche, and `tv-65-inch-dimensions` already answers that one properly.
 *
 * A product with no parseable measurement is absent rather than estimated,
 * which is the same rule the dimension tables follow. The payload ships to the
 * browser, so each row carries only what the tool needs to answer and to link.
 */
const FIT_CATEGORIES = [
  "refrigerators",
  "freezers",
  "washing-machines",
  "dryers",
  "dishwashers",
  "ovens",
  "cooktops",
  "microwaves",
] as const;

export interface FitCandidate {
  slug: string;
  name: string;
  brand: string | null;
  categorySlug: string;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  inStock: boolean;
}

export async function getFitCandidates(): Promise<FitCandidate[]> {
  const products = await getProducts();
  const allowed = new Set<string>(FIT_CATEGORIES);
  const rows: FitCandidate[] = [];

  for (const product of products) {
    if (!product.categorySlug || !allowed.has(product.categorySlug)) continue;
    const measured = measure(product);
    const body = measured?.body ?? null;
    if (!body) continue;
    rows.push({
      slug: product.slug,
      name: product.name,
      brand: measured?.brand ?? null,
      categorySlug: product.categorySlug,
      widthCm: body.widthCm,
      heightCm: body.heightCm,
      depthCm: body.depthCm,
      inStock: product.availability === "in_stock",
    });
  }

  return rows.sort((a, b) => a.widthCm - b.widthCm || a.name.localeCompare(b.name));
}
