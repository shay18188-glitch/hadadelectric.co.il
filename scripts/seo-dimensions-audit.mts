/**
 * Coverage and correctness report for the dimension parser.
 *
 * The parser deliberately refuses ambiguous input, so the number that matters
 * is not "how many did we parse" but "how many did we parse WRONG". Run this
 * before publishing anything built on catalog dimensions.
 *
 *   npx tsx scripts/seo-dimensions-audit.mts              # coverage by category
 *   npx tsx scripts/seo-dimensions-audit.mts טלוויזיות    # one category, in full
 *   npx tsx scripts/seo-dimensions-audit.mts --misses     # what failed to parse
 */

import { Base44CatalogResponseSchema } from "../types/api";
import type { Base44Product } from "../types/api";
import { extractDimensions, formatDimensions, panelSizeFromName, panelWidthFromName } from "../lib/seo/dimensions";

const appId = process.env.NEXT_PUBLIC_BASE44_APP_ID || "697dbf6bdde569f5ea050a4e";
const endpoint =
  (process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${appId}`) + "/functions/getProductCatalog";

const MENTIONS_DIMENSIONS = /מידות|ממדים|רוחב|גובה|עומק/;

async function load(): Promise<Base44Product[]> {
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(90_000) });
  const parsed = Base44CatalogResponseSchema.safeParse(await response.json());
  if (!parsed.success || !parsed.data.success) throw new Error("catalog response invalid");
  return parsed.data.data;
}

/**
 * An independent check, available only for TVs: a 16:9 panel of D inches is
 * D * 0.8716 inches wide, so a parsed width can be verified against the screen
 * size stated in the product name rather than merely believed.
 */
function expectedTvWidthCm(name: string): number | null {
  return panelWidthFromName(name);
}

async function main() {
  const products = await load();
  const arg = process.argv[2];
  const byCategory = new Map<string, { total: number; mentions: number; parsed: number; misses: string[] }>();
  const tvChecks: string[] = [];
  const suspicious: string[] = [];
  const feedErrors: string[] = [];

  for (const product of products) {
    const category = product.category?.trim() || "—";
    const specs = product.technical_specifications ?? "";
    const bucket = byCategory.get(category) ?? { total: 0, mentions: 0, parsed: 0, misses: [] };
    bucket.total++;
    if (MENTIONS_DIMENSIONS.test(specs)) bucket.mentions++;

    const isDisplay = category === "טלוויזיות" || category === "מסכי מחשב";
    const dimensions = extractDimensions(specs, { panelSize: isDisplay ? panelSizeFromName(product.name) : null });
    if (dimensions?.bodyRejected) {
      feedErrors.push(`${category} · ${product.model_number} (${product.brand ?? "—"}): ${dimensions.bodyRejected.trim().slice(0, 120)}  ← smaller than the panel it encloses`);
    }
    if (dimensions?.cutoutRejected) {
      feedErrors.push(`${category} · ${product.model_number} (${product.brand ?? "—"}): ${dimensions.cutoutRejected.trim().slice(0, 120)}`);
    }
    const measured = dimensions?.primary ?? dimensions?.withStand ?? null;
    if (measured) {
      bucket.parsed++;
      if (arg === category) {
        console.log(
          `${product.model_number.padEnd(24)} ${product.brand ?? "—"}`.padEnd(44) +
            (dimensions?.primary ? `body ${formatDimensions(dimensions.primary)}` : "").padEnd(34) +
            (dimensions?.withStand ? `stand ${formatDimensions(dimensions.withStand)}` : "").padEnd(34) +
            (dimensions?.vesa ? `VESA ${dimensions.vesa} ` : "") +
            (dimensions?.cutout
              ? `cut-out ${[dimensions.cutout.widthText && "W" + dimensions.cutout.widthText, dimensions.cutout.depthText && "D" + dimensions.cutout.depthText, dimensions.cutout.heightText && "H" + dimensions.cutout.heightText].filter(Boolean).join(" ")}`
              : "")
        );
      }
      // Cross-check the parse against geometry where geometry is available.
      if (category === "טלוויזיות") {
        const expected = expectedTvWidthCm(product.name);
        if (expected) {
          const delta = Math.abs(measured.widthCm - expected) / expected;
          const line = `${product.model_number} parsed ${measured.widthCm.toFixed(1)}cm vs panel ${expected.toFixed(1)}cm (${(100 * delta).toFixed(1)}%)`;
          tvChecks.push(line);
          if (delta > 0.06) suspicious.push(line);
        }
      }
    } else if (MENTIONS_DIMENSIONS.test(specs)) {
      const clause = specs.split(/[;|\n]/).find((part) => MENTIONS_DIMENSIONS.test(part));
      bucket.misses.push(`${product.model_number}: ${clause?.trim().slice(0, 110)}`);
    }
    byCategory.set(category, bucket);
  }

  if (arg === "--misses") {
    for (const [category, bucket] of [...byCategory].sort((a, b) => b[1].misses.length - a[1].misses.length)) {
      if (bucket.misses.length === 0) continue;
      console.log(`\n### ${category}  (${bucket.misses.length} unparsed)`);
      for (const miss of bucket.misses.slice(0, 10)) console.log(`   ${miss}`);
    }
    return;
  }
  if (arg && arg !== "--misses") return;

  console.log(`${"category".padEnd(24)} ${"total".padStart(6)} ${"claims".padStart(7)} ${"parsed".padStart(7)} ${"rate".padStart(6)}`);
  const sorted = [...byCategory].sort((a, b) => b[1].parsed - a[1].parsed);
  let totalMentions = 0;
  let totalParsed = 0;
  for (const [category, bucket] of sorted) {
    totalMentions += bucket.mentions;
    totalParsed += bucket.parsed;
    if (bucket.mentions === 0) continue;
    const rate = Math.round((100 * bucket.parsed) / bucket.mentions);
    console.log(`${category.padEnd(24)} ${String(bucket.total).padStart(6)} ${String(bucket.mentions).padStart(7)} ${String(bucket.parsed).padStart(7)} ${String(rate).padStart(5)}%`);
  }
  console.log(`\nTOTAL  claims dimensions ${totalMentions}   parsed ${totalParsed}   (${Math.round((100 * totalParsed) / totalMentions)}%)`);
  if (feedErrors.length > 0) {
    console.log(`\nSUPPLIER DATA ERRORS — measurement contradicts the product it describes (${feedErrors.length}):`);
    for (const line of feedErrors) console.log(`   x ${line}`);
  }
  console.log(`\nTV geometry cross-check: ${tvChecks.length} checked, ${suspicious.length} outside 6% of the 16:9 panel width`);
  for (const line of suspicious.slice(0, 15)) console.log(`   ! ${line}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
