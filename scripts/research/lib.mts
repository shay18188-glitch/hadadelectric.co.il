/**
 * Shared pieces of the low-cost research pipeline (design C).
 *
 *   research.mts  Haiku 5.5 (Sonnet 5.5 on escalation) searches and fetches
 *                 with the server-side web tools and returns facts, each with
 *                 a verbatim quote from a page it fetched.
 *   (this file)   Code checks every quote against the fetched page text and
 *                 decides which pages are about the exact model. A model never
 *                 grades its own evidence.
 *   qa.mts        One Opus 5.5 pass per product through the Batch API, with
 *                 no web access: it judges meaning, units, market and identity,
 *                 and writes the Hebrew content from kept facts only.
 *
 * Nothing here touches price or stock.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const CACHE = resolve(ROOT, ".research-cache");

export const MODELS = {
  haiku: "claude-haiku-5-5",
  sonnet: "claude-sonnet-5-5",
  opus: "claude-opus-5-5",
} as const;

/** USD per MTok, from platform.claude.com/docs/en/about-claude/pricing (2026-11-11). */
const PRICES: Record<string, { in: number; cw: number; cr: number; out: number; longIn?: number; longCw?: number; longCr?: number; longOut?: number }> = {
  "claude-haiku-5-5": { in: 0.1, cw: 0.125, cr: 0.01, out: 0.5, longIn: 0.5, longCw: 0.625, longCr: 0.05, longOut: 2.5 },
  "claude-sonnet-5-5": { in: 2, cw: 2.5, cr: 0.1, out: 10 },
  "claude-opus-5-5": { in: 4, cw: 5, cr: 0.2, out: 20 },
};
const SEARCH_USD = 10 / 1000;

export interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  server_tool_use?: { web_search_requests?: number | null; web_fetch_requests?: number | null } | null;
}

/** Dollar cost of one response. `batch` halves every token price. */
export function costOf(model: string, usage: UsageLike, batch = false): number {
  const p = PRICES[model];
  const cw = usage.cache_creation_input_tokens ?? 0;
  const cr = usage.cache_read_input_tokens ?? 0;
  const prompt = usage.input_tokens + cw + cr;
  const long = p.longIn !== undefined && prompt > 100_000;
  const rate = {
    in: long ? p.longIn! : p.in,
    cw: long ? p.longCw! : p.cw,
    cr: long ? p.longCr! : p.cr,
    out: long ? p.longOut! : p.out,
  };
  const f = batch ? 0.5 : 1;
  const tokens = (usage.input_tokens * rate.in + cw * rate.cw + cr * rate.cr + usage.output_tokens * rate.out) / 1e6;
  return tokens * f + (usage.server_tool_use?.web_search_requests ?? 0) * SEARCH_USD;
}

/** Comparable form of page text and quotes: letters and digits only. */
export function squash(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Numbers in a string, with thousands separators removed: "1,200 W" -> [1200]. */
export function numbersIn(text: string): number[] {
  const cleaned = text.normalize("NFKC").replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  return (cleaned.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(",", ".")));
}

const SCALES = [1, 10, 100, 1000, 0.1, 0.01, 0.001];

/**
 * Every number in `value` appears in `quote`, allowing only a metric unit
 * shift (mm ↔ cm ↔ m, g ↔ kg). Anything else — rounding, inches, a sum the
 * model did itself — fails, because the published value must be readable off
 * the page.
 */
export function numbersSupported(value: string, quote: string): boolean {
  const have = numbersIn(quote);
  return numbersIn(value).every((n) =>
    have.some((q) => SCALES.some((s) => Math.abs(n * s - q) <= 1e-6 * Math.max(1, Math.abs(q))))
  );
}

/** Model-number forms that count as "this page names the exact model". */
export function modelKeys(catalogModel: string, manufacturerModel?: string): string[] {
  const base = catalogModel.replace(/\s*\(\d+\)\s*$/, "");
  return [base, manufacturerModel ?? ""].map(squash).filter((k) => k.length >= 4);
}

export interface FetchedDoc {
  url: string;
  title: string | null;
  kind: "text" | "pdf";
  text: string;
}

/** Plain text of a PDF document block, via pypdf in an isolated interpreter. */
export function pdfText(base64: string): string {
  const run = spawnSync("python3", ["-I", resolve(ROOT, "scripts/research/pdf_text.py")], {
    input: base64,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 60_000,
  });
  return run.status === 0 ? run.stdout : "";
}

export type EvidenceStatus = "ok" | "not-fetched" | "quote-not-on-page" | "numbers-not-in-quote" | "quote-too-short";

/** Checks one quote against the pages fetched in the same run. */
export function checkEvidence(
  value: string,
  ev: { url: string; quote: string },
  docs: Map<string, FetchedDoc>
): EvidenceStatus {
  const doc = docs.get(normalizeUrl(ev.url));
  if (!doc) return "not-fetched";
  const q = squash(ev.quote);
  if (q.length < 8) return "quote-too-short";
  if (!squash(doc.text).includes(q)) return "quote-not-on-page";
  if (!numbersSupported(value, ev.quote)) return "numbers-not-in-quote";
  return "ok";
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return `${u.host.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}${u.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export async function writeJson(path: string, data: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 1)}\n`, "utf8");
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

/** Same rule as lib/research/schema.ts `researchFileName`. */
export function fileStem(modelNumber: string): string {
  return modelNumber.trim().replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
}

export interface CatalogProduct {
  model_number: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  origin_country?: string | null;
  technical_specifications?: string | null;
  product_capabilities?: string | null;
  is_available?: boolean | null;
}

/** Only the fields research may see. Price and stock never leave the feed. */
export function researchInput(p: CatalogProduct) {
  return {
    model_number: p.model_number.trim(),
    name: p.name,
    brand: p.brand ?? null,
    category: p.category ?? null,
    origin_country: p.origin_country ?? null,
    technical_specifications: p.technical_specifications ?? null,
    product_capabilities: p.product_capabilities ?? null,
  };
}

/** Runs `fn` over `items` with at most `limit` in flight. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
}
