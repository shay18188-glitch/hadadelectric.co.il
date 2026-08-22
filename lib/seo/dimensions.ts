/**
 * Extracts physical dimensions from the supplier spec text.
 *
 * Why: Search Console shows "מידות" queries as the one cluster where this site
 * genuinely outranks the price-comparison sites — `/guides/built-in-appliance-
 * dimensions` sits at position 6.3 on 613 impressions, higher than anything on
 * the site except the home page. Meanwhile 231 impressions a month for "מידות
 * טלוויזיה 65 אינץ" and its variants land around position 34 with no page to
 * answer them. The catalog already carries the answer: 641 of 891 products
 * ship measured dimensions in `technical_specifications`.
 *
 * The parser refuses to guess. A dimension is returned only when the source
 * text says which number is which — either by labelling each axis, or by
 * declaring the order in the field name. A bare "1447 x 895 x 296" with no
 * declared order is reported as unparsed rather than assumed to be W×H×D,
 * because a wrong depth on a built-in oven is the kind of error that ends with
 * a customer's kitchen cabinet cut to the wrong size.
 *
 * Every result carries the clause it came from, so a claim on a page can
 * always be traced back to the supplier record that supports it.
 */

const CM_PER_MM = 0.1;

export interface Dimensions {
  widthCm: number;
  heightCm: number;
  depthCm: number;
}

/**
 * The opening a built-in appliance drops into: the granite cut-out for a
 * cooktop, the cabinet niche for an oven. Held separately from the body
 * measurement and stored as text, because suppliers publish tolerances
 * ("560-568 מ״מ") that a single number would misrepresent — and a cut-out is
 * the one measurement where being wrong means re-cutting a worktop.
 */
export interface CutoutDimensions {
  widthText: string | null;
  depthText: string | null;
  heightText: string | null;
}

export interface ProductDimensions {
  /** Measured without a stand / as the appliance body. */
  primary: Dimensions | null;
  /** TVs and similar: the footprint once the stand is attached. */
  withStand: Dimensions | null;
  /** VESA wall-mount pattern, verbatim (e.g. "300x200 מ"מ"). */
  vesa: string | null;
  /** Cut-out / niche opening, when the supplier publishes a plausible one. */
  cutout: CutoutDimensions | null;
  /**
   * A measurement that parsed cleanly but cannot be true. Carried rather than
   * dropped so the data-quality audit can list it; never rendered on a page.
   */
  cutoutRejected: string | null;
  /** Same, for a body measurement that contradicts the panel geometry. */
  bodyRejected: string | null;
  /** The exact clauses the numbers were read from. */
  sources: string[];
}

type Axis = "width" | "height" | "depth";

const AXIS_WORDS: Record<Axis, RegExp> = {
  width: /^ר$|רוחב|width/i,
  height: /^ג$|גובה|height/i,
  depth: /^[עא]$|עומק|אורך|depth/i,
};

/** Splits a spec blob into the clause-sized pieces a dimension lives in. */
function clauses(text: string): string[] {
  return text
    .split(/[;|\n]+/)
    .flatMap((part) => part.split(/(?<=[.])\s+(?=[א-תA-Z])/))
    .map((part) => part.trim())
    .filter(Boolean);
}

function unitScale(text: string): number | null {
  if (/מ"מ|מ״מ|מ׳׳מ|\bmm\b/i.test(text)) return CM_PER_MM;
  if (/ס"מ|ס״מ|סמ\b|\bcm\b/i.test(text)) return 1;
  return null;
}

function toNumber(raw: string): number {
  return Number.parseFloat(raw.replace(",", "."));
}

function plausible(value: number): boolean {
  // Anything outside this range is a weight, a wattage or a parse error, not a
  // household appliance measurement in centimetres.
  return value >= 3 && value <= 300;
}

function complete(partial: Partial<Dimensions>): Dimensions | null {
  const { widthCm, heightCm, depthCm } = partial;
  if (widthCm === undefined || heightCm === undefined || depthCm === undefined) return null;
  if (![widthCm, heightCm, depthCm].every(plausible)) return null;
  return { widthCm, heightCm, depthCm };
}

/**
 * Rule 1 — each axis is named next to its own number:
 *   "רוחב 144.5 ס"מ, גובה 83.8 ס"מ, עומק 6.7 ס"מ"
 *   "144.1 ס"מ (רוחב), 82.6 ס"מ (גובה), 4.51 ס"מ (עומק)"
 */
function parseLabelledAxes(clause: string): Dimensions | null {
  const scale = unitScale(clause);
  if (scale === null) return null;

  const found: Partial<Dimensions> = {};
  // A number and an axis word within a short window of each other, either order.
  const pattern =
    /(?:(רוחב|גובה|עומק|אורך|width|height|depth)\s*[:=]?\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:ס"מ|ס״מ|סמ|cm|מ"מ|מ״מ|mm)?\s*[({[]?\s*(רוחב|גובה|עומק|אורך|width|height|depth))/gi;

  for (const match of clause.matchAll(pattern)) {
    const word = (match[1] ?? match[4] ?? "").toLowerCase();
    const value = toNumber(match[2] ?? match[3] ?? "");
    if (!word || Number.isNaN(value)) continue;
    const scaled = value * scale;
    if (AXIS_WORDS.width.test(word) && found.widthCm === undefined) found.widthCm = scaled;
    else if (AXIS_WORDS.height.test(word) && found.heightCm === undefined) found.heightCm = scaled;
    else if (AXIS_WORDS.depth.test(word) && found.depthCm === undefined) found.depthCm = scaled;
  }
  return complete(found);
}

/**
 * Rule 2 — the field name declares the order, the values follow as a triple:
 *   "ממדים כולל מעמד (רוחב x גובה x עומק): 144.7 x 90.1 x 26.9 ס"מ"
 *   "מידות (גובה x עומק x רוחב): 595x494x595 מ"מ"   ← order is NOT W×H×D
 */
function parseDeclaredOrder(clause: string): Dimensions | null {
  const scale = unitScale(clause);
  if (scale === null) return null;

  // Full words ("רוחב x גובה x עומק") or the abbreviation suppliers also use
  // ("רxגxע"). Both declare the order explicitly, which is the only thing
  // that makes a bare triple safe to read.
  const order =
    clause.match(/(רוחב|גובה|עומק|אורך)\s*[x×*]\s*(רוחב|גובה|עומק|אורך)\s*[x×*]\s*(רוחב|גובה|עומק|אורך)/i) ??
    clause.match(/\(\s*([רגעא])\s*[x×*]\s*([רגעא])\s*[x×*]\s*([רגעא])\s*\)/);
  if (!order) return null;

  const triple = clause.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)/);
  if (!triple) return null;

  const found: Partial<Dimensions> = {};
  for (let i = 0; i < 3; i++) {
    const word = order[i + 1];
    const scaled = toNumber(triple[i + 1]) * scale;
    if (Number.isNaN(scaled)) return null;
    if (AXIS_WORDS.width.test(word)) found.widthCm = scaled;
    else if (AXIS_WORDS.height.test(word)) found.heightCm = scaled;
    else if (AXIS_WORDS.depth.test(word)) found.depthCm = scaled;
  }
  return complete(found);
}

/**
 * Rule 3 — a bare triple, accepted only when an independent fact confirms the
 * order: "מידות ללא מעמד: 1666x958x69.5 מ"מ".
 *
 * For a television the fact is geometry. A 16:9 panel with a D-inch diagonal
 * is D × 0.8716 inches wide, so the caller can supply the width the first
 * number *must* have. If it matches, the order is W×H×D — verified, not
 * assumed. If it does not, the clause stays unparsed.
 *
 * No other category gets this rule, because no other category has a
 * measurement derivable from the product name.
 */
function parseVerifiedTriple(
  clause: string,
  expected: { widthCm: number; heightCm: number },
  tolerance = 0.06
): Dimensions | null {
  const scale = unitScale(clause);
  if (scale === null) return null;
  const triple = clause.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)/);
  if (!triple) return null;

  const [a, b, c] = [1, 2, 3].map((i) => toNumber(triple[i]) * scale);
  if ([a, b, c].some(Number.isNaN)) return null;
  if (Math.abs(a - expected.widthCm) / expected.widthCm > tolerance) return null;

  // Width alone does not pin the order: two records in the feed publish
  // W × D × H ("1669x103x958" — a 10 mm-deep panel listed second). The panel
  // height is just as derivable as the width, so test the remaining pair
  // against it and take whichever assignment the geometry supports. Neither
  // fitting means the record is unreadable, not that one may be assumed.
  const heightFits = (value: number) => Math.abs(value - expected.heightCm) / expected.heightCm <= tolerance + 0.09;
  if (heightFits(b) && c < b) return complete({ widthCm: a, heightCm: b, depthCm: c });
  if (heightFits(c) && b < c) return complete({ widthCm: a, heightCm: c, depthCm: b });
  return null;
}

/**
 * The width a 16:9 panel of the given diagonal must have, in centimetres.
 * Returns null when the name does not state a screen size.
 */
export function panelSizeFromName(name: string): { widthCm: number; heightCm: number } | null {
  const inches = name.match(/(\d{2})\s*['\u05f3"\u05f4]/);
  if (!inches) return null;
  const diagonal = Number(inches[1]);
  if (diagonal < 20 || diagonal > 120) return null;
  const diagonalCm = diagonal * 2.54;
  return {
    widthCm: (diagonalCm * 16) / Math.hypot(16, 9),
    heightCm: (diagonalCm * 9) / Math.hypot(16, 9),
  };
}

/** Convenience wrapper for callers that only need the width. */
export function panelWidthFromName(name: string): number | null {
  return panelSizeFromName(name)?.widthCm ?? null;
}

function parseClause(clause: string, expected?: { widthCm: number; heightCm: number } | null): Dimensions | null {
  const labelled = parseLabelledAxes(clause) ?? parseDeclaredOrder(clause);
  if (labelled) return labelled;
  return expected ? parseVerifiedTriple(clause, expected) : null;
}

const CUTOUT = /חיתוך|גומחה|נישה|cut\s*-?\s*out|cutout/i;

/** Formats a value plus its unit as the page will print it: "56 ס״מ", "560–568 מ״מ". */
function formatMeasure(raw: string, unit: string): string {
  return `${raw.replace(/\s*-\s*/, "–").replace(",", ".")} ${unit}`;
}

/**
 * Reads a cut-out or niche opening.
 *
 * Values are kept as written, ranges included. Rule 1 (each axis named beside
 * its number) is the only rule applied — a bare "56x49" is accepted solely
 * when the caller supplies the product's own width to confirm which number is
 * which, exactly as with Rule 3 above.
 */
function parseCutout(clause: string, bodyWidthCm?: number | null): CutoutDimensions | null {
  if (!CUTOUT.test(clause)) return null;
  const unit = /מ"מ|מ״מ|\bmm\b/i.test(clause) ? "מ״מ" : /ס"מ|ס״מ|סמ\b|\bcm\b/i.test(clause) ? "ס״מ" : null;
  if (!unit) return null;
  const scale = unit === "מ״מ" ? CM_PER_MM : 1;

  const found: CutoutDimensions = { widthText: null, depthText: null, heightText: null };
  const labelled = /(רוחב|עומק|גובה)[^\d]{0,24}?(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)/g;
  for (const match of clause.matchAll(labelled)) {
    const value = formatMeasure(match[2], unit);
    if (/רוחב/.test(match[1]) && !found.widthText) found.widthText = value;
    else if (/עומק/.test(match[1]) && !found.depthText) found.depthText = value;
    else if (/גובה/.test(match[1]) && !found.heightText) found.heightText = value;
  }
  if (found.widthText || found.depthText) return found;

  // Bare pair, e.g. "מידות חיתוך שיש: 56x49 ס״מ". Accept only when the first
  // value lines up with the appliance's own width, which fixes the order.
  const pair = clause.match(/(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)/);
  if (!pair || !bodyWidthCm) return null;
  const firstCm = toNumber(pair[1]) * scale;
  if (Math.abs(firstCm - bodyWidthCm) > 5) return null;
  return { widthText: formatMeasure(pair[1], unit), depthText: formatMeasure(pair[2], unit), heightText: null };
}

const WITH_STAND = /עם\s*מעמד|כולל\s*מעמד|with\s*stand/i;
const WITHOUT_STAND = /ללא\s*מעמד|בלי\s*מעמד|without\s*stand/i;
const PACKAGING = /אריז|משלוח|קרטון|package|packing|gross/i;

/**
 * Reads every dimension a product record supports.
 *
 * Packaging dimensions are skipped on purpose — a carton measurement answers a
 * different question than "will it fit the niche", and mixing the two is how a
 * dimensions table stops being trustworthy.
 */
export function extractDimensions(
  specsText: string | null | undefined,
  options?: { panelSize?: { widthCm: number; heightCm: number } | null }
): ProductDimensions | null {
  if (!specsText) return null;

  let primary: Dimensions | null = null;
  let withStand: Dimensions | null = null;
  let vesa: string | null = null;
  let cutout: CutoutDimensions | null = null;
  let cutoutRejected: string | null = null;
  let bodyRejected: string | null = null;
  const sources: string[] = [];
  const allClauses = clauses(specsText);

  for (const clause of allClauses) {
    // Bounded, non-greedy: `VESA[^:]*` used to swallow "400x30" and capture
    // the leftover "0x300" as the pattern.
    const vesaMatch = clause.match(/VESA[^\d]{0,12}(\d{2,4}\s*[x×*]\s*\d{2,4})/i);
    if (vesaMatch && !vesa) vesa = vesaMatch[1].replace(/\s+/g, "").replace(/[x×*]/i, "x");

    if (!/מידות|ממדים|רוחב|גובה|עומק|dimensions/i.test(clause)) continue;
    if (PACKAGING.test(clause)) continue;
    // A cut-out clause is not the appliance body; it is handled in the second
    // pass below, once the body width is known and can vouch for the order.
    if (CUTOUT.test(clause)) continue;

    const parsed = parseClause(clause, options?.panelSize);
    if (!parsed) continue;

    // A display's body encloses its panel, so it can never measure smaller
    // than the panel does. Screen sizes are nominal (a "55 inch" set is often
    // 54.6"), which is what the 4% allowance covers — a record claiming a
    // 64.3 cm body around a 68.5 cm panel is a supplier error, not a tight fit.
    if (options?.panelSize) {
      const floor = options.panelSize.heightCm * 0.96;
      if (parsed.heightCm < floor || parsed.widthCm < options.panelSize.widthCm * 0.96) {
        bodyRejected = clause;
        continue;
      }
    }

    if (WITH_STAND.test(clause)) {
      if (!withStand) {
        withStand = parsed;
        sources.push(clause);
      }
    } else if (!primary) {
      primary = parsed;
      sources.push(clause);
      void WITHOUT_STAND;
    }
  }

  for (const clause of allClauses) {
    if (cutout) break;
    if (PACKAGING.test(clause)) continue;
    const parsed = parseCutout(clause, primary?.widthCm ?? withStand?.widthCm ?? null);
    if (!parsed) continue;

    // Sanity, calibrated against the real spread in the feed rather than a
    // neat assumption. An opening runs a little narrower than the appliance
    // above it, and can run wider than one that slides into it — an integrated
    // fridge needs clearance. Both directions are legitimate. Across every
    // record that survives, the narrower direction never exceeds 4.5 cm.
    //
    // Several 65–75 cm cooktops in the feed list 56 cm, the standard cut-out of
    // a 60 cm model. That is a copy-paste error in the source record, and
    // publishing it would send someone to cut a worktop far too narrow. The
    // 6 cm bound rejects those while clearing every genuine overhang.
    const bodyWidth = primary?.widthCm ?? withStand?.widthCm ?? null;
    const cutoutWidth = parsed.widthText ? parseCmText(parsed.widthText) : null;
    if (bodyWidth && cutoutWidth && (bodyWidth - cutoutWidth > 6 || cutoutWidth - bodyWidth > 4)) {
      cutoutRejected = clause;
      continue;
    }

    cutout = parsed;
    sources.push(clause);
  }

  if (!primary && !withStand && !vesa && !cutout) return null;
  return { primary, withStand, vesa, cutout, cutoutRejected, bodyRejected, sources };
}

/** Reads the low end of a formatted measure back into centimetres. */
function parseCmText(text: string): number | null {
  const value = Number.parseFloat(text.replace(",", "."));
  if (Number.isNaN(value)) return null;
  return /מ״מ|מ"מ|mm/i.test(text) ? value * CM_PER_MM : value;
}

/** "144.5 × 83.8 × 6.7 ס״מ" — one decimal, no trailing zeros. */
export function formatDimensions(dimensions: Dimensions): string {
  const round = (value: number) => Number(value.toFixed(1)).toString();
  return `${round(dimensions.widthCm)} × ${round(dimensions.heightCm)} × ${round(dimensions.depthCm)} ס״מ`;
}
