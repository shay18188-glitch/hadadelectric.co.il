/**
 * Local-agent runner for design C: the same rules and code checks as the API
 * runner, but the research and QA are done by Claude Code subagents, which
 * call this CLI for every step that must not be left to a model.
 *
 *   product   --model M                prints the catalog fields research may see
 *   fetch     --run R --model M --url U [--find "a|b"] [--offset N]
 *             Downloads a page (HTML or PDF) once, keeps its plain text as the
 *             evidence base, and prints it (or only the lines matching --find).
 *   submit    --run R --model M --file F --by haiku|sonnet
 *             Validates a research submission, checks every quote against the
 *             pages this product fetched, keeps the richer draft, and prints
 *             what failed so the agent can repair quotes (only by copying
 *             real page text, since the check is mechanical).
 *   qa-input  --run R --model M         prints the review payload for QA
 *   qa-submit --run R --model M --file F   validates QA output, assembles the record
 *   status    --run R --list L          one line per product
 *
 * The catalog is read from --catalog (a saved copy) so nothing hits Base44.
 * Nothing here reads or writes price or stock.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { CACHE, fileStem, normalizeUrl, pdfText, readJson, researchInput, writeJson, type CatalogProduct, type FetchedDoc } from "./lib.mjs";
import { SubmissionSchema, TODAY, evaluate, type Draft } from "./research-core.mjs";
import { assemble, reviewPayload, type QaOutput } from "./qa-core.mjs";
import { ResearchRecordSchema, AGENT_SOURCE_KINDS } from "../../lib/research/schema";

const [command] = process.argv.slice(2);
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const need = (name: string) => {
  const v = arg(name);
  if (!v) throw new Error(`--${name} is required`);
  return v;
};

const run = arg("run") ?? "local";
const runDir = resolve(CACHE, run);
const DEFAULT_CATALOG = resolve(CACHE, "catalog.json");

async function catalogProduct(model: string): Promise<CatalogProduct> {
  const path = arg("catalog") ?? DEFAULT_CATALOG;
  const data = (JSON.parse(await readFile(path, "utf8")).data as CatalogProduct[]).filter(Boolean);
  const hit = data.find((p) => p.model_number.trim().toUpperCase() === model.trim().toUpperCase());
  if (!hit) throw new Error(`model ${model} not in ${path}`);
  return hit;
}

// ---------- fetch ----------

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "", ndash: "–", mdash: "—", times: "×", deg: "°", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", reg: "®", trade: "™", copy: "©", frac12: "½", sup2: "²", sup3: "³", plusmn: "±", micro: "µ" };

function htmlText(html: string): { title: string | null; text: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  // Structured data often carries the spec sheet on retail pages; keep it as text.
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n");
  const body = html
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|dt|dd|section|article|table|ul|ol)>/gi, "\n")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<[^>]+>/g, " ");
  const decode = (s: string) =>
    s
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
  const tidy = (s: string) =>
    s
      .split("\n")
      .map((line) => line.replace(/[ \t ]+/g, " ").trim())
      .filter((line) => line && line !== "|")
      .join("\n");
  let text = tidy(decode(`${body}\n${ld}`));
  // Script-rendered sites (Next.js, Nuxt...) ship their text inside inline
  // script payloads. It is still the page's own text, so it counts as evidence.
  if (text.length < 3000) text += `\n${embeddedStrings(html)}`;
  return { title: title ? decode(title) : null, text };
}

function embeddedStrings(html: string): string {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const literal = /"((?:[^"\\\n]|\\.){2,})"/g;
  const out: string[] = [];
  const take = (s: string, depth: number) => {
    for (const m of s.matchAll(literal)) {
      let v: string;
      try {
        v = JSON.parse(`"${m[1]}"`);
      } catch {
        continue;
      }
      if (depth < 2 && v.length > 40 && /"(?:[^"\\]|\\.)+"/.test(v)) {
        take(v, depth + 1);
        continue;
      }
      if (!/\p{L}/u.test(v) || /^(https?:|\/|\$|#)/.test(v) || /function|=>|[{};]|base64,/.test(v)) continue;
      if (!/\s/.test(v) && /[-_]/.test(v) && v.length > 15) continue; // translation keys, css classes
      out.push(v.replace(/<[^>]+>/g, " ").trim());
    }
  };
  for (const s of scripts) take(s, 0);
  return [...new Set(out)].filter(Boolean).join("\n");
}

const pagesDir = (stem: string) => resolve(runDir, "pages", stem);
const pageFile = (stem: string, url: string) => resolve(pagesDir(stem), `${createHash("sha1").update(normalizeUrl(url)).digest("hex").slice(0, 16)}.json`);

async function loadPages(stem: string): Promise<Map<string, FetchedDoc>> {
  const docs = new Map<string, FetchedDoc>();
  if (!existsSync(pagesDir(stem))) return docs;
  for (const f of await readdir(pagesDir(stem))) {
    if (!f.endsWith(".json")) continue;
    const doc = await readJson<FetchedDoc & { aliases?: string[] }>(resolve(pagesDir(stem), f));
    for (const u of [doc.url, ...(doc.aliases ?? [])]) docs.set(normalizeUrl(u), doc);
  }
  return docs;
}

async function fetchCommand() {
  const model = need("model");
  const url = need("url");
  const stem = fileStem(model);
  const file = pageFile(stem, url);
  let doc: FetchedDoc & { aliases?: string[] };
  if (existsSync(file)) {
    doc = await readJson(file);
  } else {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "accept-language": "he-IL,he;q=0.9,en;q=0.8",
        },
      });
    } catch (error) {
      console.log(`FETCH FAILED: ${(error as Error).message}. Try another URL.`);
      return;
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      console.log(`FETCH FAILED: HTTP ${res.status}. Try another URL.`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 25 * 1024 * 1024) {
      console.log("FETCH FAILED: file larger than 25 MB.");
      return;
    }
    const type = res.headers.get("content-type") ?? "";
    const isPdf = type.includes("pdf") || buf.subarray(0, 5).toString() === "%PDF-";
    const parsed = isPdf ? { title: null, text: pdfText(buf.toString("base64")) } : htmlText(buf.toString("utf8"));
    doc = { url, title: parsed.title, kind: isPdf ? "pdf" : "text", text: parsed.text, aliases: res.url && res.url !== url ? [res.url] : [] };
    await writeJson(file, doc);
  }
  const lines = doc.text.split("\n");
  console.log(`URL: ${doc.url}\nTITLE: ${doc.title ?? ""}\nKIND: ${doc.kind}, ${doc.text.length} chars, ${lines.length} lines`);
  if (doc.text.length < 200) console.log("WARNING: almost no text (page may need JavaScript or blocks bots). Prefer another source.");
  const find = arg("find");
  if (find) {
    const re = new RegExp(find, "i");
    const hits = lines.flatMap((line, i) => (re.test(line) ? [i] : []));
    const show = new Set(hits.flatMap((i) => [i - 1, i, i + 1]).filter((i) => i >= 0 && i < lines.length));
    console.log(`--- ${hits.length} matching lines (with neighbours) ---`);
    let out = "";
    for (const i of [...show].sort((a, b) => a - b)) out += `${lines[i]}\n`;
    console.log(out.slice(0, 12_000));
    return;
  }
  const offset = Number(arg("offset") ?? 0);
  const slice = doc.text.slice(offset, offset + 12_000);
  console.log(`--- text from char ${offset} ---\n${slice}`);
  if (offset + 12_000 < doc.text.length) console.log(`--- more: rerun with --offset ${offset + 12_000} or use --find ---`);
}

// ---------- submit ----------

async function submitCommand() {
  const model = need("model");
  const by = need("by");
  const stem = fileStem(model);
  const raw = JSON.parse(await readFile(need("file"), "utf8"));
  const parsed = SubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    console.log("INVALID SUBMISSION — fix and resubmit:");
    for (const issue of parsed.error.issues.slice(0, 15)) console.log(`  ${issue.path.join(".")}: ${issue.message}`);
    return;
  }
  const sub = parsed.data as Draft["submission"] & object;
  const product = await catalogProduct(model);
  const docs = await loadPages(stem);
  const scored = evaluate(sub, docs, product.model_number);
  const draftPath = resolve(runDir, "drafts", `${stem}.json`);
  const previous = existsSync(draftPath) ? await readJson<Draft>(draftPath) : null;
  const attempt = { model: `local-${by}`, costUsd: 0, searches: 0, fetches: docs.size, requests: 0, maxPrompt: 0 };
  const keep = !previous?.submission || scored.okFacts >= previous.okFacts;
  const draft: Draft = keep
    ? {
        modelNumber: product.model_number.trim(),
        researchedAt: TODAY,
        catalog: researchInput(product),
        attempts: [...(previous?.attempts ?? []), attempt],
        usedModel: `local-${by}`,
        submission: sub,
        ...scored,
      }
    : { ...previous!, attempts: [...previous!.attempts, attempt] };
  await writeJson(draftPath, draft);

  const exact = Object.entries(scored.exactPages).filter(([, p]) => p.catalogForm || p.manufacturerForm).length;
  console.log(`SAVED${keep ? "" : " (previous draft was richer and is kept)"}. ok-facts=${scored.okFacts} of ${sub.facts.length}; fetched pages=${new Set([...docs.values()].map((d) => d.url)).size}, naming the exact model=${exact}`);
  const report = (name: string, items: { evidence: { url: string; quote: string }[] }[], checks: string[][], show: (i: number) => string) => {
    items.forEach((item, i) => {
      const bad = checks[i].map((c, j) => ({ c, ev: item.evidence[j] })).filter((x) => x.c !== "ok");
      if (bad.length === checks[i].length)
        console.log(`  ${name}[${i}] ${show(i)} -> ${bad.map((b) => `${b.c} (${b.ev.url})`).join("; ")}`);
    });
  };
  console.log("Items with no passing quote (fix by copying the exact page text, or drop them):");
  report("facts", sub.facts, scored.checks.facts, (i) => `${sub.facts[i].label}=${sub.facts[i].value}`);
  report("features", sub.features, scored.checks.features, (i) => sub.features[i].text.slice(0, 60));
  report("inTheBox", sub.inTheBox, scored.checks.inTheBox, (i) => sub.inTheBox[i].text.slice(0, 60));
  report("installation", sub.installation, scored.checks.installation, (i) => sub.installation[i].text.slice(0, 60));
  const offPage = sub.facts.filter((f, i) =>
    scored.checks.facts[i].some((c, j) => c === "ok" && !(scored.exactPages[normalizeUrl(f.evidence[j].url)]?.catalogForm || scored.exactPages[normalizeUrl(f.evidence[j].url)]?.manufacturerForm))
  ).length;
  if (offPage) console.log(`  ${offPage} facts quote only pages that never name the model — those do not count.`);
}

// ---------- QA ----------

async function qaInputCommand() {
  const draft = await readJson<Draft>(resolve(runDir, "drafts", `${fileStem(need("model"))}.json`));
  if (!draft.submission) throw new Error("no submission for this product");
  console.log(JSON.stringify(reviewPayload(draft)));
}

const decision = z.object({ id: z.number().int(), decision: z.enum(["keep", "reject", "conflict"]), text: z.string(), note: z.string() });
const QaSchema = z.object({
  verdict: z.enum(["pass", "pass-with-fixes", "fail"]),
  notes: z.string(),
  identity: z.object({ matchConfidence: z.enum(["high", "medium", "low"]), israeliImporter: z.string().nullable(), notes: z.string() }),
  sources: z.array(z.object({ url: z.string(), kind: z.enum(AGENT_SOURCE_KINDS) })),
  facts: z.array(z.object({ id: z.number().int(), decision: z.enum(["keep", "reject", "conflict"]), label: z.string(), value: z.string(), note: z.string() })),
  features: z.array(decision),
  inTheBox: z.array(decision),
  installation: z.array(decision),
  content: z.object({
    summary: z.string(),
    highlights: z.array(z.string()),
    goodFor: z.array(z.string()),
    considerations: z.array(z.string()),
    faq: z.array(z.object({ q: z.string(), a: z.string() })),
  }),
  seo: z.object({ metaDescription: z.string(), keywords: z.array(z.string()) }),
  reviewFlags: z.array(z.object({ field: z.string(), issue: z.string(), severity: z.enum(["high", "medium", "low"]) })),
});

async function qaSubmitCommand() {
  const model = need("model");
  const stem = fileStem(model);
  const draft = await readJson<Draft>(resolve(runDir, "drafts", `${stem}.json`));
  const parsed = QaSchema.safeParse(JSON.parse(await readFile(need("file"), "utf8")));
  if (!parsed.success) {
    console.log("INVALID QA OUTPUT — fix and resubmit:");
    for (const issue of parsed.error.issues.slice(0, 15)) console.log(`  ${issue.path.join(".")}: ${issue.message}`);
    return;
  }
  const { record, dropped } = assemble(draft, parsed.data as QaOutput);
  const valid = ResearchRecordSchema.safeParse(record);
  if (!valid.success) {
    console.log(`RECORD INVALID: ${valid.error.issues.slice(0, 5).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    return;
  }
  await writeJson(resolve(runDir, "records", `${stem}.json`), valid.data);
  const kept = record.specGroups.flatMap((g) => g.rows).filter((r) => r.status === "verified" && r.confidence !== "low").length;
  console.log(`RECORD SAVED. verdict=${record.qa!.verdict} identity=${record.identity.matchConfidence} publishable-rows=${kept} guard-dropped=${dropped.length}`);
  for (const d of dropped) console.log(`  removed: ${d}`);
}

// ---------- status ----------

async function statusCommand() {
  const models = (await readFile(need("list"), "utf8")).split("\n").map((m) => m.trim()).filter(Boolean);
  let drafted = 0;
  let recorded = 0;
  for (const model of models) {
    const stem = fileStem(model);
    const dp = resolve(runDir, "drafts", `${stem}.json`);
    const rp = resolve(runDir, "records", `${stem}.json`);
    const d = existsSync(dp) ? await readJson<Draft>(dp) : null;
    const r = existsSync(rp) ? await readJson<{ qa?: { verdict: string }; identity: { matchConfidence: string } }>(rp) : null;
    if (d) drafted++;
    if (r) recorded++;
    console.log(`${model.padEnd(28)} ${d ? `ok=${String(d.okFacts).padStart(2)} by=${d.usedModel}` : "no draft".padEnd(22)} ${r ? `qa=${r.qa?.verdict} id=${r.identity.matchConfidence}` : ""}`);
  }
  console.log(`drafted ${drafted}/${models.length}, QA records ${recorded}/${models.length}`);
}

async function productCommand() {
  console.log(JSON.stringify(researchInput(await catalogProduct(need("model"))), null, 1));
}

const commands: Record<string, () => Promise<void>> = {
  product: productCommand,
  fetch: fetchCommand,
  submit: submitCommand,
  "qa-input": qaInputCommand,
  "qa-submit": qaSubmitCommand,
  status: statusCommand,
};

(commands[command] ?? (async () => console.log(`commands: ${Object.keys(commands).join(", ")}`)))().catch((error) => {
  console.error(`ERROR: ${(error as Error).message}`);
  process.exit(1);
});
