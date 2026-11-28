/**
 * Site-search log: what shoppers typed, how many results they got and what
 * they did next. It exists so search can be fixed from real queries — the
 * weekly review (docs/search/WEEKLY_SEARCH_REVIEW.md) reads it through
 * scripts/search-log-report.mts.
 *
 * Privacy: no IP, cookie, user agent or visitor id is stored — only the
 * query text, a result count, an outcome and a timestamp. Digit runs that
 * could be a phone or ID number and anything shaped like an e-mail address
 * are masked before storage. Entries expire.
 *
 * Server-side only.
 */
import { pipeline, redis, isStoreConfigured, parseZsetWithScores } from "@/lib/analytics/store";

export const SEARCH_OUTCOMES = ["click", "results_page", "abandon"] as const;
export type SearchOutcomeKind = (typeof SEARCH_OUTCOMES)[number];
export const SEARCH_CLICK_KINDS = ["product", "category", "brand", "filter", "shortcut"] as const;
export type SearchClickKind = (typeof SEARCH_CLICK_KINDS)[number];
export const SEARCH_SOURCES = ["header", "bottom_bar", "results_page", "other"] as const;
export type SearchSource = (typeof SEARCH_SOURCES)[number];

export interface SearchLogInput {
  q: string;
  /** Results the shopper saw for this query. */
  n: number;
  o: SearchOutcomeKind;
  k?: SearchClickKind;
  s?: SearchSource;
  /** The engine's "showing results for" text, when it corrected the query. */
  c?: string;
}

export interface SearchLogEntry extends SearchLogInput {
  t: string;
}

const LOG_KEY = "sq:log";
const LOG_MAX = 20_000;
const WEEK_TTL_SECONDS = 60 * 60 * 24 * 200;

function oneOf<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Clean shopper text for storage; null when nothing worth keeping remains. */
export function sanitizeSearchText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let text = raw
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  text = text
    .replace(/\S+@\S+/g, "[email]")
    // 7+ digits, allowing separators: a phone, ID or card number, never a model.
    .replace(/(?:\+?\d[\s-]?){7,}/g, "[number]");
  return text.length >= 2 ? text : null;
}

export function parseSearchLogInput(raw: unknown): SearchLogInput | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const q = sanitizeSearchText(item.q);
  const o = oneOf(SEARCH_OUTCOMES, item.o);
  if (!q || !o) return null;
  const n = Math.max(0, Math.min(999, Math.floor(Number(item.n) || 0)));
  const c = sanitizeSearchText(item.c) ?? undefined;
  return { q, n, o, k: oneOf(SEARCH_CLICK_KINDS, item.k), s: oneOf(SEARCH_SOURCES, item.s), c };
}

/** ISO week key in Israel time, e.g. "2026-W48". */
export function weekKey(date = new Date()): string {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" })
    .format(date)
    .split("-")
    .map(Number);
  const thursday = new Date(Date.UTC(year, month - 1, day));
  thursday.setUTCDate(thursday.getUTCDate() - ((thursday.getUTCDay() + 6) % 7) + 3);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function recordSearchLogs(entries: SearchLogInput[]): Promise<void> {
  if (!isStoreConfigured() || entries.length === 0) return;
  const week = weekKey();
  const now = new Date().toISOString();
  const cmds: (string | number)[][] = [];
  for (const entry of entries.slice(0, 5)) {
    const record: SearchLogEntry = { t: now, ...entry };
    const member = entry.q.toLowerCase();
    cmds.push(["LPUSH", LOG_KEY, JSON.stringify(record)]);
    cmds.push(["ZINCRBY", `z:sq:${week}`, 1, member]);
    if (entry.n === 0) cmds.push(["ZINCRBY", `z:sq0:${week}`, 1, member]);
    if (entry.o === "abandon") cmds.push(["ZINCRBY", `z:sqab:${week}`, 1, member]);
    cmds.push(["HINCRBY", "totals", `search_log_${entry.o}`, 1]);
  }
  cmds.push(["LTRIM", LOG_KEY, 0, LOG_MAX - 1]);
  for (const prefix of ["z:sq", "z:sq0", "z:sqab"]) cmds.push(["EXPIRE", `${prefix}:${week}`, WEEK_TTL_SECONDS]);
  await pipeline(cmds);
}

export interface SearchLogSummary {
  week: string;
  top: { query: string; count: number }[];
  zero: { query: string; count: number }[];
  abandoned: { query: string; count: number }[];
  recent: SearchLogEntry[];
}

function ranked(raw: unknown) {
  return parseZsetWithScores(raw).map((entry) => ({ query: entry.member, count: entry.score }));
}

/** This week's ranked queries plus the most recent raw entries (admin view). */
export async function getSearchLogSummary(recent = 40): Promise<SearchLogSummary | null> {
  if (!isStoreConfigured()) return null;
  const week = weekKey();
  const res = await pipeline([
    ["ZREVRANGE", `z:sq:${week}`, 0, 24, "WITHSCORES"],
    ["ZREVRANGE", `z:sq0:${week}`, 0, 24, "WITHSCORES"],
    ["ZREVRANGE", `z:sqab:${week}`, 0, 24, "WITHSCORES"],
    ["LRANGE", LOG_KEY, 0, recent - 1],
  ]);
  if (!res) return null;
  const rows = Array.isArray(res[3]) ? (res[3] as unknown[]) : [];
  return {
    week,
    top: ranked(res[0]),
    zero: ranked(res[1]),
    abandoned: ranked(res[2]),
    recent: rows.flatMap((row) => {
      try {
        return [JSON.parse(String(row)) as SearchLogEntry];
      } catch {
        return [];
      }
    }),
  };
}

/** Raw entries newest-first, for the weekly review script. */
export async function readSearchLog(limit = LOG_MAX): Promise<SearchLogEntry[]> {
  const rows = await redis("LRANGE", LOG_KEY, 0, limit - 1);
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    try {
      return [JSON.parse(String(row)) as SearchLogEntry];
    } catch {
      return [];
    }
  });
}
