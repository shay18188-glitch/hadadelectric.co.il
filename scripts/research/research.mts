/**
 * Research stage: one cheap model call per product, with server-side search
 * and fetch, returning facts that each carry a verbatim quote.
 *
 *   npx tsx scripts/research/research.mts --catalog <saved-catalog.json> --models "A,B" [--run name] [--concurrency 5]
 *   npx tsx scripts/research/research.mts --catalog <file> --list <models.txt> ...
 *
 * Writes .research-cache/<run>/drafts/<model>.json (submission + code checks +
 * cost) and .research-cache/<run>/pages/<model>.json (fetched page text, the
 * evidence base for the checks). Re-running skips products already drafted.
 */
import Anthropic from "@anthropic-ai/sdk";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  CACHE,
  MODELS,
  costOf,
  fileStem,
  normalizeUrl,
  pdfText,
  pool,
  readJson,
  researchInput,
  writeJson,
  type CatalogProduct,
  type FetchedDoc,
} from "./lib.mjs";
import { SUBMIT_TOOL, SYSTEM, TODAY, evaluate, type Draft, type Submission } from "./research-core.mjs";
export type { Draft, Submission } from "./research-core.mjs";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function collectDocs(content: Anthropic.ContentBlock[], docs: Map<string, FetchedDoc>) {
  for (const block of content) {
    if (block.type !== "web_fetch_tool_result") continue;
    const result = block.content;
    if (result.type !== "web_fetch_result") continue;
    const source = result.content.source;
    const text = source.type === "text" ? source.data : source.type === "base64" ? pdfText(source.data) : "";
    docs.set(normalizeUrl(result.url), {
      url: result.url,
      title: result.content.title,
      kind: source.type === "base64" ? "pdf" : "text",
      text,
    });
  }
}

async function attempt(client: Anthropic, model: string, product: ReturnType<typeof researchInput>) {
  const docs = new Map<string, FetchedDoc>();
  const stats = { model, costUsd: 0, searches: 0, fetches: 0, requests: 0, maxPrompt: 0 } as Draft["attempts"][number];
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Today is ${TODAY}. Research this product from the store's catalog (its current text may be wrong — verify everything):\n${JSON.stringify(product, null, 1)}`,
    },
  ];
  let submission: Submission | null = null;
  let nudges = 0;

  for (let turn = 0; turn < 14 && !submission; turn++) {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      cache_control: { type: "ephemeral" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [
        { type: "web_search_20250305", name: "web_search", max_uses: 6 },
        { type: "web_fetch_20250910", name: "web_fetch", max_uses: 8, max_content_tokens: 6000 },
        SUBMIT_TOOL,
      ],
      messages,
    });
    stats.requests += 1;
    stats.costUsd += costOf(model, response.usage);
    stats.searches += response.usage.server_tool_use?.web_search_requests ?? 0;
    stats.fetches += response.usage.server_tool_use?.web_fetch_requests ?? 0;
    stats.maxPrompt = Math.max(
      stats.maxPrompt,
      response.usage.input_tokens + (response.usage.cache_creation_input_tokens ?? 0) + (response.usage.cache_read_input_tokens ?? 0)
    );
    collectDocs(response.content, docs);

    const submit = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_research"
    );
    if (submit) {
      submission = submit.input as Submission;
      break;
    }
    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason === "pause_turn") continue;
    if (response.stop_reason === "refusal" || nudges >= 2) break;
    nudges += 1;
    messages.push({ role: "user", content: "Call submit_research now with what you have verified. Facts you could not quote go in reviewFlags, not in facts." });
  }
  return { submission, docs, stats };
}

async function researchOne(client: Anthropic, product: CatalogProduct, run: string): Promise<Draft | null> {
  const input = researchInput(product);
  const stem = fileStem(input.model_number);
  const draftPath = resolve(CACHE, run, "drafts", `${stem}.json`);
  if (existsSync(draftPath)) return readJson<Draft>(draftPath);

  const draft: Draft = {
    modelNumber: input.model_number,
    researchedAt: TODAY,
    catalog: input,
    attempts: [],
    usedModel: MODELS.haiku,
    submission: null,
    exactPages: {},
    checks: { facts: [], features: [], inTheBox: [], installation: [] },
    okFacts: 0,
  };
  const pages: Record<string, FetchedDoc> = {};

  // Haiku first; Sonnet once when Haiku comes back thin. The richer of the two is kept.
  for (const model of [MODELS.haiku, MODELS.sonnet]) {
    try {
      const { submission, docs, stats } = await attempt(client, model, input);
      draft.attempts.push(stats);
      if (submission) {
        const scored = evaluate(submission, docs, input.model_number);
        if (!draft.submission || scored.okFacts > draft.okFacts) {
          Object.assign(draft, { submission, usedModel: model, ...scored });
          for (const key of Object.keys(pages)) delete pages[key];
          for (const [key, doc] of docs) pages[key] = doc;
        }
      }
    } catch (error) {
      draft.attempts.push({ model, costUsd: 0, searches: 0, fetches: 0, requests: 0, maxPrompt: 0, error: (error as Error).message });
    }
    const thin = draft.okFacts < 6 || !Object.values(draft.exactPages).some((p) => p.catalogForm || p.manufacturerForm);
    if (!thin) break;
  }

  await writeJson(resolve(CACHE, run, "pages", `${stem}.json`), pages);
  await writeJson(draftPath, draft);
  return draft;
}

async function main() {
  const catalogPath = arg("catalog");
  const run = arg("run") ?? "calibration";
  const concurrency = Number(arg("concurrency") ?? 5);
  if (!catalogPath) throw new Error("--catalog <saved Base44 catalog response> is required");
  const catalog = (JSON.parse(await readFile(catalogPath, "utf8")).data as CatalogProduct[]).filter(Boolean);
  const wanted = arg("models")
    ? arg("models")!.split(",")
    : arg("list")
      ? (await readFile(arg("list")!, "utf8")).split("\n")
      : [];
  const keys = new Set(wanted.map((m) => m.trim().toUpperCase()).filter(Boolean));
  const products = catalog.filter((p) => keys.has(p.model_number.trim().toUpperCase()));
  const missing = [...keys].filter((k) => !products.some((p) => p.model_number.trim().toUpperCase() === k));
  if (missing.length) console.warn(`[research] not in catalog: ${missing.join(", ")}`);

  const client = new Anthropic();
  let spent = 0;
  await pool(products, concurrency, async (product, i) => {
    const draft = await researchOne(client, product, run);
    const cost = draft?.attempts.reduce((s, a) => s + a.costUsd, 0) ?? 0;
    spent += cost;
    const models = draft?.attempts.map((a) => `${a.model.replace("claude-", "")}${a.error ? "!" : ""}`).join("+");
    console.log(
      `[${i + 1}/${products.length}] ${product.model_number.trim().padEnd(26)} ${models} ok-facts=${draft?.okFacts ?? 0} $${cost.toFixed(3)} (running $${spent.toFixed(2)})`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
