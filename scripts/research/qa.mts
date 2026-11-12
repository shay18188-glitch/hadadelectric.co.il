/**
 * QA stage: one Opus 5.5 review per product through the Batch API (50% off),
 * then assembly into the record format the compiler gates.
 *
 *   npx tsx scripts/research/qa.mts --run calibration [--out <records dir>]
 *
 * The reviewer has no web access. It sees the catalog record, every fact with
 * its quotes and the code's verdict on each quote, and decides keep / reject /
 * conflict, corrects labels and wording, judges identity and market, and
 * writes the Hebrew content. Code then re-checks every number it touched:
 * an edited value must still be readable off a verified quote, and any number
 * in the written content must appear in a kept fact. Re-running resumes the
 * same batch instead of paying for a new one.
 */
import Anthropic from "@anthropic-ai/sdk";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { CACHE, MODELS, ROOT, costOf, fileStem, readJson, writeJson } from "./lib.mjs";
import type { Draft } from "./research-core.mjs";
import { QA_SCHEMA, SYSTEM, assemble, reviewPayload, type QaOutput } from "./qa-core.mjs";
import { ResearchRecordSchema } from "../../lib/research/schema";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const run = arg("run") ?? "calibration";
const outDir = resolve(ROOT, arg("out") ?? `.research-cache/${run}/records`);
const runDir = resolve(CACHE, run);

async function main() {
  const client = new Anthropic();
  const draftDir = resolve(runDir, "drafts");
  const drafts = (await Promise.all(
    (await readdir(draftDir)).filter((f) => f.endsWith(".json")).map((f) => readJson<Draft>(resolve(draftDir, f)))
  )).filter((d) => d.submission);
  const batchFile = resolve(runDir, "qa-batch.json");

  let batchId: string;
  if (existsSync(batchFile)) {
    batchId = (await readJson<{ id: string }>(batchFile)).id;
    console.log(`[qa] resuming batch ${batchId}`);
  } else {
    const batch = await client.messages.batches.create({
      requests: drafts.map((d) => ({
        custom_id: fileStem(d.modelNumber).slice(0, 64),
        params: {
          model: MODELS.opus,
          max_tokens: 16000,
          output_config: { effort: "medium", format: { type: "json_schema", schema: QA_SCHEMA } },
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: JSON.stringify(reviewPayload(d)) }],
        },
      })),
    });
    batchId = batch.id;
    await writeJson(batchFile, { id: batchId, models: drafts.map((d) => d.modelNumber) });
    console.log(`[qa] submitted batch ${batchId} with ${drafts.length} reviews`);
  }

  for (;;) {
    const batch = await client.messages.batches.retrieve(batchId);
    if (batch.processing_status === "ended") break;
    console.log(`[qa] ${batch.processing_status}: ${batch.request_counts.processing} processing, ${batch.request_counts.succeeded} done`);
    await new Promise((r) => setTimeout(r, 30_000));
  }

  const byStem = new Map(drafts.map((d) => [fileStem(d.modelNumber).slice(0, 64), d]));
  let cost = 0;
  for await (const result of await client.messages.batches.results(batchId)) {
    const draft = byStem.get(result.custom_id);
    if (!draft) continue;
    if (result.result.type !== "succeeded") {
      console.log(`[qa] ${draft.modelNumber}: ${result.result.type}`);
      continue;
    }
    const message = result.result.message;
    cost += costOf(MODELS.opus, message.usage, true);
    const text = message.content.find((b) => b.type === "text");
    if (message.stop_reason !== "end_turn" || !text || text.type !== "text") {
      console.log(`[qa] ${draft.modelNumber}: stop_reason ${message.stop_reason}`);
      continue;
    }
    const { record, dropped } = assemble(draft, JSON.parse(text.text) as QaOutput);
    const parsed = ResearchRecordSchema.safeParse(record);
    if (!parsed.success) {
      console.log(`[qa] ${draft.modelNumber}: invalid record ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
      continue;
    }
    await writeJson(resolve(outDir, `${fileStem(draft.modelNumber)}.json`), parsed.data);
    const kept = record.specGroups.flatMap((g) => g.rows).filter((r) => r.status === "verified" && r.confidence !== "low").length;
    console.log(`[qa] ${draft.modelNumber.padEnd(26)} ${record.qa!.verdict.padEnd(15)} identity=${record.identity.matchConfidence} publishable-rows=${kept} guard-dropped=${dropped.length}`);
  }
  const researchCost = drafts.reduce((sum, d) => sum + d.attempts.reduce((a, b) => a + b.costUsd, 0), 0);
  await writeJson(resolve(runDir, "cost.json"), { products: drafts.length, researchUsd: researchCost, qaUsd: cost, totalUsd: researchCost + cost });
  console.log(`[qa] cost: research $${researchCost.toFixed(2)} + QA $${cost.toFixed(2)} = $${(researchCost + cost).toFixed(2)} for ${drafts.length} products ($${((researchCost + cost) / drafts.length).toFixed(3)} each)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
