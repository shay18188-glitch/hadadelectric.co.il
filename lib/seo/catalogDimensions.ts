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

  return {
    slug: product.slug,
    name: product.name,
    brand: seoBrandName(product.brand),
    modelNumber: product.modelNumber,
    body: dimensions.primary,
    withStand: dimensions.withStand,
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
  const matching = products.filter((product) => {
    if (product.categorySlug !== spec.categorySlug) return false;
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
