/**
 * Compiles researched product records into what the site publishes.
 *
 *   npx tsx scripts/compile-research.mts            # compile + write
 *   npx tsx scripts/compile-research.mts --check    # validate only, exit 1 on errors
 *   npx tsx scripts/compile-research.mts --file X   # validate one record
 *
 * Reads `content/product-research/records/*.json`, validates each against
 * `ResearchRecordSchema`, and writes:
 *
 *   content/productResearch.json           publishable facts only, keyed by model
 *   content/product-research/review-queue.md  everything withheld, for a person
 *
 * This file is the gate. A record that has not passed independent QA
 * publishes nothing; inside a passed record, a fact publishes only when
 * `isPublishable` says so. No network access, so it is safe in every build.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import {
  ResearchRecordSchema,
  SPEC_GROUPS,
  isPublishable,
  researchFileName,
  type PublishedResearch,
  type ResearchRecord,
  type SpecGroupId,
} from "../lib/research/schema";

const root = process.cwd();
const args = process.argv.slice(2);
const opt = (name: string) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : null);
// --records/--out/--queue let a test run compile into its own cache without
// touching the published file.
const recordsDir = resolve(root, opt("records") ?? "content/product-research/records");
const outPath = resolve(root, opt("out") ?? "content/productResearch.json");
const queuePath = resolve(root, opt("queue") ?? "content/product-research/review-queue.md");

const checkOnly = args.includes("--check");
const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;

const GROUP_ORDER = Object.keys(SPEC_GROUPS) as SpecGroupId[];

interface Withheld {
  model: string;
  where: string;
  text: string;
  why: string;
}

function lint(record: ResearchRecord): string[] {
  const errors: string[] = [];
  const ids = new Set(record.sources.map((s) => s.id));
  if (ids.size !== record.sources.length) errors.push("duplicate source ids");
  const refs = [
    ...record.specGroups.flatMap((g) => g.rows.flatMap((r) => r.sources)),
    ...[...record.features, ...record.inTheBox, ...record.installation].flatMap((f) => f.sources),
    ...record.content.faq.flatMap((f) => f.sources),
    ...record.catalogCheck.flatMap((c) => c.sources),
  ];
  for (const ref of refs) if (!ids.has(ref)) errors.push(`unknown source ref ${ref}`);
  const groupIds = record.specGroups.map((g) => g.id);
  if (new Set(groupIds).size !== groupIds.length) errors.push("spec group listed twice");
  for (const row of record.specGroups.flatMap((g) => g.rows)) {
    if (row.status === "verified" && row.sources.length === 0) errors.push(`verified row without source: ${row.label}`);
  }
  return errors;
}

/**
 * An en dash between two numbers ("50–250°C") is a neutral character, so in a
 * Hebrew line the browser lays the two numbers out right to left and shows
 * "250°C–50". A hyphen-minus between digits joins them into one number run,
 * which keeps the range in reading order.
 */
const bidiSafe = (text: string) => text.replace(/(\d)\s?[–—]\s?(?=\d)/g, "$1-");

function publish(record: ResearchRecord, withheld: Withheld[]): PublishedResearch | null {
  const model = record.modelNumber;
  const passed = record.qa && record.qa.verdict !== "fail";
  if (!passed) {
    withheld.push({ model, where: "record", text: "entire record", why: record.qa ? `QA failed: ${record.qa.notes}` : "not yet QA-reviewed" });
    return null;
  }
  if (record.identity.matchConfidence === "low") {
    withheld.push({ model, where: "record", text: "entire record", why: "sources may not describe this exact SKU" });
    return null;
  }
  // A passed QA does not outrank an open doubt about which product this is.
  // If anyone flagged the identity itself as high severity, every fact in the
  // record may belong to a different unit, so none of it is published.
  const identityDoubt = record.reviewFlags.find(
    (flag) => flag.severity === "high" && /identity|model|דגם|מק["״]?ט/i.test(flag.field)
  );
  if (identityDoubt) {
    withheld.push({ model, where: "record", text: "entire record", why: `open identity flag: ${identityDoubt.issue}` });
    return null;
  }

  const sources = new Map(record.sources.map((s) => [s.id, s]));
  const keep = <T extends { sources: string[]; status: string; confidence: string; note?: string }>(
    fact: T,
    where: string,
    text: string
  ) => {
    if (isPublishable(fact as never, sources)) {
      return true;
    }
    withheld.push({ model, where, text, why: `${fact.status}/${fact.confidence}${fact.note ? ` — ${fact.note}` : ""}` });
    return false;
  };

  const specGroups = [...record.specGroups]
    .sort((a, b) => GROUP_ORDER.indexOf(a.id) - GROUP_ORDER.indexOf(b.id))
    .map((group) => ({
      id: group.id,
      title: SPEC_GROUPS[group.id],
      rows: group.rows
        .filter((row) => keep(row, `spec/${group.id}`, `${row.label}: ${row.value}`))
        .map(({ label, value }) => ({ label, value })),
    }))
    .filter((group) => group.rows.length > 0);

  const texts = (list: ResearchRecord["features"], where: string) =>
    list.filter((f) => keep(f, where, f.text)).map((f) => f.text);

  const features = texts(record.features, "features");
  const inTheBox = texts(record.inTheBox, "inTheBox");
  const installation = texts(record.installation, "installation");

  for (const flag of record.reviewFlags) {
    withheld.push({ model, where: `flag/${flag.severity}`, text: flag.field, why: flag.issue });
  }

  if (specGroups.length === 0) {
    withheld.push({ model, where: "record", text: "entire record", why: "no publishable spec rows" });
    return null;
  }

  return bidiSafeAll({
    modelNumber: model,
    researchedAt: record.researchedAt,
    manufacturer: record.identity.manufacturer,
    israeliImporter: record.identity.israeliImporter,
    specGroups,
    features,
    inTheBox,
    installation,
    summary: record.content.summary,
    highlights: record.content.highlights,
    goodFor: record.content.goodFor,
    considerations: record.content.considerations,
    faq: record.content.faq.map(({ q, a }) => ({ q, a })),
    metaDescription: record.seo.metaDescription,
  });
}

function bidiSafeAll(research: PublishedResearch): PublishedResearch {
  const list = (items: string[]) => items.map(bidiSafe);
  return {
    ...research,
    specGroups: research.specGroups.map((g) => ({ ...g, rows: g.rows.map((r) => ({ label: r.label, value: bidiSafe(r.value) })) })),
    features: list(research.features),
    inTheBox: list(research.inTheBox),
    installation: list(research.installation),
    summary: bidiSafe(research.summary),
    highlights: list(research.highlights),
    goodFor: list(research.goodFor),
    considerations: list(research.considerations),
    faq: research.faq.map((f) => ({ q: bidiSafe(f.q), a: bidiSafe(f.a) })),
    metaDescription: bidiSafe(research.metaDescription),
  };
}

async function main() {
  const files = fileArg
    ? [resolve(fileArg)]
    : (await readdir(recordsDir).catch(() => [] as string[]))
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => resolve(recordsDir, f));

  const published: Record<string, PublishedResearch> = {};
  const withheld: Withheld[] = [];
  const errors: string[] = [];

  for (const file of files) {
    let record: ResearchRecord;
    try {
      const parsed = ResearchRecordSchema.safeParse(JSON.parse(await readFile(file, "utf8")));
      if (!parsed.success) {
        errors.push(`${basename(file)}: ${parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
        continue;
      }
      record = parsed.data;
    } catch (error) {
      errors.push(`${basename(file)}: ${(error as Error).message}`);
      continue;
    }
    if (basename(file) !== researchFileName(record.modelNumber)) {
      errors.push(`${basename(file)}: expected file name ${researchFileName(record.modelNumber)}`);
    }
    const problems = lint(record);
    if (problems.length) {
      errors.push(`${basename(file)}: ${problems.join("; ")}`);
      continue;
    }
    const result = publish(record, withheld);
    if (result) published[record.modelNumber.trim().toUpperCase()] = result;
  }

  if (errors.length) {
    console.error(`[research] ${errors.length} invalid record(s):\n  ${errors.join("\n  ")}`);
  }
  console.log(`[research] ${files.length} record(s), ${Object.keys(published).length} published, ${withheld.length} item(s) withheld`);
  if (checkOnly || fileArg) process.exit(errors.length ? 1 : 0);

  await writeFile(outPath, `${JSON.stringify(published, null, 1)}\n`, "utf8");

  const byModel = new Map<string, Withheld[]>();
  for (const w of withheld) byModel.set(w.model, [...(byModel.get(w.model) ?? []), w]);
  const lines = [
    "# Research review queue",
    "",
    "Generated by `scripts/compile-research.mts`. Everything below was found but is **not published**: it is unverified, low-confidence, conflicting, or flagged. Confirm against the manufacturer or importer, then update the record.",
    "",
    ...[...byModel.entries()].flatMap(([model, items]) => [
      `## ${model}`,
      "",
      ...items.map((w) => `- **${w.where}** — ${w.text.replace(/\n/g, " ")} _(${w.why.replace(/\n/g, " ")})_`),
      "",
    ]),
  ];
  await writeFile(queuePath, `${lines.join("\n")}\n`, "utf8");
  if (errors.length) process.exit(1);
}

main();
