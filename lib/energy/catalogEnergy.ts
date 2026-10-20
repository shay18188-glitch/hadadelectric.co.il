import "server-only";

import { getProducts } from "@/lib/base44/catalog";
import { seoBrandName } from "@/lib/seo/brandNames";
import type { Product } from "@/types/product";

/**
 * The energy figures the catalog actually publishes, read off the spec sheets.
 *
 * Same discipline as `lib/seo/catalogDimensions.ts`: a value is returned only
 * when the sheet states it. An air conditioner is sized by the cooling BTU its
 * sheet quotes, a refrigerator is costed by the annual (or daily) kWh on its
 * label, and a model whose sheet is silent is left out rather than assigned a
 * category norm. The calculators then say how many models they are reporting.
 */

function specsText(product: Product): string {
  return product.specs.map((spec) => (spec.label ? `${spec.label}: ${spec.value}` : spec.value)).join(" | ");
}

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

export interface AcCandidate {
  slug: string;
  name: string;
  brand: string | null;
  modelNumber: string;
  /** Horsepower as the name states it ("מזגן 1.3 כ״ס"); null when it does not. */
  hp: number | null;
  /** Cooling output, BTU/h, from the spec sheet. */
  btu: number;
  inverter: boolean;
  portable: boolean;
  inStock: boolean;
}

/** Cooling BTU: the figure labelled as cooling, else the first BTU figure on the sheet. */
function coolingBtu(text: string): number | null {
  const labelled = /קירור[^|;]{0,30}?([\d,]{4,7})\s*BTU/i.exec(text);
  const any = /([\d,]{4,7})\s*BTU/i.exec(text);
  const value = toNumber((labelled ?? any)?.[1] ?? "");
  // A split or portable unit for a home sits between 5,000 and 60,000 BTU/h;
  // anything outside is a parse of some other number on the sheet.
  return Number.isFinite(value) && value >= 5000 && value <= 60000 ? value : null;
}

function horsepower(name: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*כ["״]ס/.exec(name);
  const value = m ? Number(m[1]) : NaN;
  return Number.isFinite(value) && value > 0 && value < 10 ? value : null;
}

/** The air-conditioner reading for one product, or null when its sheet gives no cooling BTU. */
export function acCandidate(product: Product): AcCandidate | null {
  if (product.categorySlug !== "air-conditioners") return null;
  const text = specsText(product);
  const btu = coolingBtu(text) ?? coolingBtu(product.name);
  if (!btu) return null;
  const label = `${product.name} ${product.modelNumber}`;
  return {
    slug: product.slug,
    name: product.name,
    brand: seoBrandName(product.brand),
    modelNumber: product.modelNumber,
    hp: horsepower(product.name),
    btu,
    inverter: !/ON\s*\/\s*OFF/i.test(label) && /אינוורטר|inverter|\bINV\b/i.test(`${label} ${text}`),
    portable: /נייד/.test(product.name),
    inStock: product.availability === "in_stock",
  };
}

export async function getAcCandidates(): Promise<AcCandidate[]> {
  const products = await getProducts();
  return products
    .map(acCandidate)
    .filter((row): row is AcCandidate => row !== null)
    .sort((a, b) => a.btu - b.btu || a.name.localeCompare(b.name));
}

export interface FridgeCandidate {
  slug: string;
  name: string;
  brand: string | null;
  modelNumber: string;
  categorySlug: string;
  annualKwh: number;
  inStock: boolean;
}

/**
 * Annual consumption, in kWh, when the sheet says so explicitly.
 *
 * Only two phrasings are trusted: a figure tied to "שנתית/לשנה", or a daily
 * figure ("ליממה") multiplied out. A bare "94 קוט״ש" with no period could be
 * per cycle, per 100 cycles or per year, so it is not read at all.
 */
export function annualKwh(text: string): number | null {
  const annual =
    /שנתי\w*[^|;]{0,25}?(\d{2,4}(?:\.\d+)?)\s*(?:קוט["״]?ש|kWh)/i.exec(text) ??
    /(\d{2,4}(?:\.\d+)?)\s*(?:קוט["״]?ש|kWh)\s*(?:לשנה|בשנה|\/\s*שנה)/i.exec(text);
  if (annual) {
    const value = Number(annual[1]);
    return value >= 60 && value <= 1000 ? value : null;
  }
  const daily = /(\d(?:\.\d+)?)\s*(?:קוט["״]?ש|kWh)\s*(?:ליממה|ליום|\/\s*יום)/i.exec(text);
  if (daily) {
    const value = Number(daily[1]) * 365;
    return value >= 60 && value <= 1000 ? Math.round(value) : null;
  }
  return null;
}

const FRIDGE_CATEGORIES = new Set(["refrigerators", "freezers"]);

/** The consumption reading for one refrigerator or freezer, or null when its label figure is not published. */
export function fridgeCandidate(product: Product): FridgeCandidate | null {
  if (!product.categorySlug || !FRIDGE_CATEGORIES.has(product.categorySlug)) return null;
  const kwh = annualKwh(specsText(product));
  if (!kwh) return null;
  return {
    slug: product.slug,
    name: product.name,
    brand: seoBrandName(product.brand),
    modelNumber: product.modelNumber,
    categorySlug: product.categorySlug,
    annualKwh: kwh,
    inStock: product.availability === "in_stock",
  };
}

export async function getFridgeCandidates(): Promise<FridgeCandidate[]> {
  const products = await getProducts();
  return products
    .map(fridgeCandidate)
    .filter((row): row is FridgeCandidate => row !== null)
    .sort((a, b) => a.annualKwh - b.annualKwh || a.name.localeCompare(b.name));
}
