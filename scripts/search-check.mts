/**
 * Search regression suite: runs every case in content/search-tests.json
 * through the real engine over content/search-catalog.json and fails (exit 1)
 * when a case breaks. Run before every change to search code or aliases:
 *
 *   npm run search:check            # all cases
 *   npm run search:check -- "נינגה"  # ad-hoc queries, printed with top results
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getSearchEngine } from "../lib/search/engine";
import type { Product } from "../types/product";

interface Case {
  q: string;
  category?: string;
  brand?: string;
  model?: string;
  corrected?: string;
  minResults?: number;
  empty?: boolean;
  note?: string;
}

const root = process.cwd();
const catalog = JSON.parse(await readFile(resolve(root, "content/search-catalog.json"), "utf8")) as { products: Product[] };
const engine = getSearchEngine(catalog.products);
const adHoc = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

function show(q: string) {
  const outcome = engine.search(q, { limit: 40 });
  const flags = [
    outcome.partial ? "PARTIAL" : "",
    outcome.correctedQuery ? `→ ${outcome.correctedQuery}` : "",
    outcome.categorySlugs.length ? `cats=${outcome.categorySlugs.slice(0, 3).join(",")}` : "",
    outcome.brandSlugs.length ? `brands=${outcome.brandSlugs.slice(0, 3).join(",")}` : "",
  ].filter(Boolean);
  console.log(`\n${q}  →  ${outcome.products.length} results ${flags.join("  ")}`);
  for (const product of outcome.products.slice(0, 5)) {
    console.log(`   ${product.modelNumber.padEnd(18)} ${product.brand ?? ""} | ${product.name} [${product.categorySlug}]`);
  }
}

if (adHoc.length > 0) {
  adHoc.forEach(show);
  process.exit(0);
}

const { cases } = JSON.parse(await readFile(resolve(root, "content/search-tests.json"), "utf8")) as { cases: Case[] };
let failures = 0;
for (const testCase of cases) {
  const outcome = engine.search(testCase.q, { limit: 60 });
  const top = outcome.products.slice(0, 3);
  const problems: string[] = [];
  if (testCase.empty) {
    if (outcome.products.length > 0) problems.push(`expected no results, got ${outcome.products.length} (${top.map((p) => p.name).join(" / ")})`);
  } else {
    const min = testCase.minResults ?? 1;
    if (outcome.products.length < min) problems.push(`expected ≥${min} results, got ${outcome.products.length}`);
    if (testCase.category && !top.every((p) => p.categorySlug === testCase.category)) {
      problems.push(`top results not all in ${testCase.category}: ${top.map((p) => p.categorySlug).join(",")}`);
    }
    if (testCase.brand && !top.every((p) => p.brandSlug === testCase.brand)) {
      problems.push(`top results not all ${testCase.brand}: ${top.map((p) => p.brandSlug).join(",")}`);
    }
    if (testCase.model && !outcome.products.slice(0, 5).some((p) => p.modelNumber === testCase.model)) {
      problems.push(`${testCase.model} not in top 5`);
    }
    if (testCase.corrected && outcome.correctedQuery !== testCase.corrected) {
      problems.push(`corrected "${outcome.correctedQuery}" ≠ "${testCase.corrected}"`);
    }
  }
  if (problems.length > 0) {
    failures++;
    console.log(`✗ ${testCase.q}: ${problems.join("; ")}`);
  }
}
console.log(`\n${cases.length - failures}/${cases.length} search cases pass`);
process.exit(failures > 0 ? 1 : 0);
