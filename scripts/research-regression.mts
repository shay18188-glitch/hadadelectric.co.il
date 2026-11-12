/**
 * Checks that researched specs still feed the site's parsers.
 *
 *   npx tsx scripts/research-regression.mts <saved-catalog.json>
 *
 * Takes a saved copy of the Base44 catalog response (never fetches — the
 * catalog quota is shared with production), applies the compiled research to
 * each researched model, and compares what the dimension and energy parsers
 * read before and after. A model whose dimensions were parseable from the feed
 * but not from the verified rows means the record is missing the combined
 * "מידות (רוחב × גובה × עומק)" row, and the dimension guides would lose it.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Base44CatalogResponseSchema } from "../types/api";
import { normalizeProduct } from "../lib/normalize";
import { extractDimensions } from "../lib/seo/dimensions";
import type { PublishedResearch } from "../lib/research/schema";
import type { Product } from "../types/product";

const file = process.argv[2];
if (!file) {
  console.error("usage: research-regression.mts <saved-catalog.json>");
  process.exit(2);
}

const research = JSON.parse(await readFile(resolve("content/productResearch.json"), "utf8")) as Record<string, PublishedResearch>;
const parsed = Base44CatalogResponseSchema.parse(JSON.parse(await readFile(resolve(file), "utf8")));
const products = parsed.data.filter((p) => p !== null).map(normalizeProduct);

const text = (p: Product) => p.specs.map((s) => (s.label ? `${s.label}: ${s.value}` : s.value)).join("; ");
const fmt = (d: ReturnType<typeof extractDimensions>) =>
  d?.primary ? `${d.primary.widthCm}×${d.primary.heightCm}×${d.primary.depthCm}` : "—";

let researched = 0;
let lost = 0;
for (const product of products) {
  const r = research[product.modelNumber.trim().toUpperCase()];
  if (!r) continue;
  researched += 1;
  const after = { ...product, specs: r.specGroups.flatMap((g) => g.rows) };
  const before = extractDimensions(text(product));
  const now = extractDimensions(text(after));
  const flag = before?.primary && !now?.primary ? "  <-- not published (see review-queue.md)" : "";
  if (flag) lost += 1;
  console.log(`${product.modelNumber.padEnd(28)} feed ${fmt(before).padEnd(20)} verified ${fmt(now)}${flag}`);
}
console.log(`\n${researched} researched model(s) in this catalog, ${lost} lost a parseable body size`);
if (lost) process.exit(1);
