/**
 * Search review report: re-runs real shopper queries through the current
 * engine and flags the ones that fail, for the weekly search review
 * (docs/search/WEEKLY_SEARCH_REVIEW.md).
 *
 * Sources (pick one or both):
 *   --redis            the production site-search log (needs REDIS_URL, e.g.
 *                      from `vercel env pull --environment=production <file>`
 *                      and `--env-file`)
 *   --queries <file>   a text/TSV file, query in the first column
 *                      (e.g. a Search Console export)
 * Options:
 *   --days <n>         only log entries from the last n days (default 7)
 *   --out <dir>        where report.json and report.md go (default ./.search-review)
 *
 * Example:
 *   npx tsx --env-file=.env.search-review scripts/search-log-report.mts --redis --days 7
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getSearchEngine } from "../lib/search/engine";
import { normalizeHebrewSearch } from "../lib/search/normalizeHebrew";
import type { Product } from "../types/product";

interface LoggedQuery {
  query: string;
  count: number;
  outcomes: Record<string, number>;
  clickKinds: Record<string, number>;
  /** Smallest result count shoppers saw when they searched it. */
  loggedResultsMin: number | null;
  sources: string[];
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const days = Number(option("days") ?? 7);
const outDir = resolve(process.cwd(), option("out") ?? ".search-review");

const catalog = JSON.parse(await readFile(resolve(process.cwd(), "content/search-catalog.json"), "utf8")) as { products: Product[] };
const engine = getSearchEngine(catalog.products);
const inStock = new Set(catalog.products.filter((p) => p.availability === "in_stock").map((p) => p.modelNumber));

const queries = new Map<string, LoggedQuery>();
function bucket(query: string, source: string): LoggedQuery {
  const key = normalizeHebrewSearch(query);
  let entry = queries.get(key);
  if (!entry) {
    entry = { query, count: 0, outcomes: {}, clickKinds: {}, loggedResultsMin: null, sources: [] };
    queries.set(key, entry);
  }
  if (!entry.sources.includes(source)) entry.sources.push(source);
  return entry;
}

let logEntries = 0;
if (flag("redis")) {
  if (!process.env.REDIS_URL) {
    console.error("REDIS_URL is not set. Pull it first: vercel env pull --environment=production .env.search-review");
    process.exit(2);
  }
  const { readSearchLog } = await import("../lib/analytics/searchLog");
  const since = Date.now() - days * 86_400_000;
  const rows = await readSearchLog();
  for (const row of rows) {
    if (Date.parse(row.t) < since) continue;
    logEntries++;
    const entry = bucket(row.q, "site");
    entry.count++;
    entry.outcomes[row.o] = (entry.outcomes[row.o] ?? 0) + 1;
    if (row.k) entry.clickKinds[row.k] = (entry.clickKinds[row.k] ?? 0) + 1;
    entry.loggedResultsMin = entry.loggedResultsMin === null ? row.n : Math.min(entry.loggedResultsMin, row.n);
  }
}

const queriesFile = option("queries");
if (queriesFile) {
  const text = await readFile(resolve(process.cwd(), queriesFile), "utf8");
  const lines = text.split(/\r?\n/).slice(1);
  for (const line of lines) {
    const [query, clicks, impressions] = line.split("\t");
    if (!query || query.trim().length < 2) continue;
    const entry = bucket(query.trim(), "google");
    entry.count += Number(impressions) || Number(clicks) || 1;
  }
}

if (queries.size === 0) {
  console.log("No queries to review.");
  process.exit(0);
}

const report = Array.from(queries.values()).map((entry) => {
  const all = engine.search(entry.query, { limit: 60 });
  const stocked = engine.search(entry.query, { limit: 60, allowed: inStock });
  const abandons = entry.outcomes.abandon ?? 0;
  const siteSearches = Object.values(entry.outcomes).reduce((a, b) => a + b, 0);
  const flags: string[] = [];
  if (all.products.length === 0) flags.push("ZERO_NOW");
  else if (stocked.products.length === 0) flags.push("ONLY_OUT_OF_STOCK");
  if (entry.loggedResultsMin === 0) flags.push("WAS_ZERO");
  if (siteSearches >= 2 && abandons / siteSearches >= 0.5) flags.push("MOSTLY_ABANDONED");
  else if (siteSearches === 1 && abandons === 1) flags.push("ABANDONED");
  if (all.partial) flags.push("PARTIAL");
  if (all.correctedQuery) flags.push("CORRECTED");
  if (all.unknownTokens.length > 0) flags.push("UNKNOWN_WORDS");
  return {
    ...entry,
    flags,
    now: {
      results: all.products.length,
      inStockResults: stocked.products.length,
      corrected: all.correctedQuery,
      unknownWords: all.unknownTokens,
      categories: all.categorySlugs.slice(0, 3),
      brands: all.brandSlugs.slice(0, 3),
      top: all.products.slice(0, 5).map((p) => ({
        model: p.modelNumber,
        brand: p.brand,
        name: p.name,
        category: p.categorySlug,
        inStock: p.availability === "in_stock",
      })),
    },
  };
});

const severity = (flags: string[]) =>
  (flags.includes("ZERO_NOW") ? 100 : 0) +
  (flags.includes("WAS_ZERO") ? 40 : 0) +
  (flags.includes("MOSTLY_ABANDONED") ? 30 : 0) +
  (flags.includes("ABANDONED") ? 15 : 0) +
  (flags.includes("ONLY_OUT_OF_STOCK") ? 20 : 0) +
  (flags.includes("PARTIAL") || flags.includes("UNKNOWN_WORDS") ? 10 : 0);
report.sort((a, b) => severity(b.flags) - severity(a.flags) || b.count - a.count);

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "report.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), days, logEntries, queries: report }, null, 1)}\n`);

const md: string[] = [
  `# Search review — ${new Date().toISOString().slice(0, 10)}`,
  "",
  `${logEntries} site searches in the last ${days} days, ${report.length} distinct queries (sources: ${[...new Set(report.flatMap((r) => r.sources))].join(", ")}).`,
  "",
  `- Zero results now: ${report.filter((r) => r.flags.includes("ZERO_NOW")).length}`,
  `- Had zero results when searched: ${report.filter((r) => r.flags.includes("WAS_ZERO")).length}`,
  `- Mostly abandoned: ${report.filter((r) => r.flags.includes("MOSTLY_ABANDONED") || r.flags.includes("ABANDONED")).length}`,
  "",
  "| # | query | count | flags | results (in stock) | top result |",
  "|---|---|---|---|---|---|",
  ...report.slice(0, 300).map((r, i) => {
    const top = r.now.top[0];
    return `| ${i + 1} | ${r.query.replace(/\|/g, "/")} | ${r.count} | ${r.flags.join(" ")} | ${r.now.results} (${r.now.inStockResults}) | ${top ? `${top.brand ?? ""} ${top.name} [${top.category}]`.replace(/\|/g, "/") : "—"} |`;
  }),
  "",
];
await writeFile(resolve(outDir, "report.md"), md.join("\n"));
console.log(`Wrote ${resolve(outDir, "report.md")} (${report.length} queries, ${logEntries} log entries)`);
process.exit(0);
