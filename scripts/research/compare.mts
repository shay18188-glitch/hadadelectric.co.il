/**
 * Scores a test run against the pilot's QA-passed records.
 *
 *   npx tsx scripts/research/compare.mts --run calibration
 *
 * Compares what each pipeline would PUBLISH (both compiled by the same gate):
 *   - contradiction: a row whose label matches a reference row in the same
 *     group but whose numbers differ — the precision failure that matters;
 *   - coverage: share of reference rows the new run also publishes;
 *   - new: rows the reference does not have (listed for manual review).
 * Rows are matched on numbers when they have any, else on squashed text.
 */
import { resolve } from "node:path";
import { CACHE, ROOT, numbersIn, readJson, squash } from "./lib.mjs";
import type { PublishedResearch } from "../../lib/research/schema";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const run = arg("run") ?? "calibration";

type Row = { group: string; label: string; value: string };
const rowsOf = (r: PublishedResearch): Row[] =>
  r.specGroups.flatMap((g) => g.rows.map((row) => ({ group: g.id, label: row.label, value: row.value })));

const sameNumbers = (a: string, b: string) => {
  const x = numbersIn(a).sort();
  const y = numbersIn(b).sort();
  return x.length > 0 && x.length === y.length && x.every((n, i) => Math.abs(n - y[i]) < 1e-6);
};
const matches = (a: Row, b: Row) =>
  numbersIn(a.value).length > 0
    ? sameNumbers(a.value, b.value)
    : squash(a.value).includes(squash(b.value)) || squash(b.value).includes(squash(a.value));
const labelKey = (label: string) => squash(label.replace(/\(.*?\)/g, ""));

async function main() {
  const reference = await readJson<Record<string, PublishedResearch>>(resolve(ROOT, "content/productResearch.json"));
  const candidate = await readJson<Record<string, PublishedResearch>>(resolve(CACHE, run, "productResearch.json"));
  let refRows = 0;
  let covered = 0;
  let newRows = 0;
  const contradictions: string[] = [];
  const newList: string[] = [];
  const missing: string[] = [];

  for (const [model, ref] of Object.entries(reference)) {
    const cand = candidate[model];
    const refList = rowsOf(ref);
    refRows += refList.length;
    if (!cand) {
      missing.push(model);
      continue;
    }
    const candList = rowsOf(cand);
    covered += refList.filter((r) => candList.some((c) => matches(c, r))).length;
    for (const c of candList) {
      if (refList.some((r) => matches(c, r))) continue;
      const sameLabel = refList.find((r) => r.group === c.group && labelKey(r.label) === labelKey(c.label));
      if (sameLabel && numbersIn(c.value).length && numbersIn(sameLabel.value).length) {
        contradictions.push(`${model} | ${c.label}: new "${c.value}" vs reference "${sameLabel.value}"`);
      } else {
        newRows += 1;
        newList.push(`${model} | ${c.group} | ${c.label}: ${c.value}`);
      }
    }
  }

  const candTotal = Object.keys(reference).reduce((n, m) => n + (candidate[m] ? rowsOf(candidate[m]).length : 0), 0);
  console.log(`reference products: ${Object.keys(reference).length}, published by new run: ${Object.keys(reference).length - missing.length}`);
  if (missing.length) console.log(`  not published by new run: ${missing.join(", ")}`);
  console.log(`reference rows: ${refRows}; covered by new run: ${covered} (${((100 * covered) / refRows).toFixed(0)}%)`);
  console.log(`new-run rows on reference products: ${candTotal}; contradictions: ${contradictions.length} (${((100 * contradictions.length) / Math.max(1, candTotal)).toFixed(1)}%); rows not in reference: ${newRows}`);
  console.log(`\nCONTRADICTIONS\n${contradictions.join("\n") || "(none)"}`);
  console.log(`\nNOT IN REFERENCE (review a sample)\n${newList.join("\n")}`);
  const others = Object.keys(candidate).filter((m) => !reference[m]);
  console.log(`\nnew products published: ${others.length} — ${others.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
