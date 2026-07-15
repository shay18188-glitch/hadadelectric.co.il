// Server-side module (route handlers, middleware, admin RSC). Not imported by
// client components — the client only sends events via /api/track.
import { pipeline, redis, parseHashNumbers, parseZsetWithScores, isStoreConfigured } from "@/lib/analytics/store";

/** Business events we persist. Kept in sync with the client allowlist. */
export const TRACKED_EVENTS = [
  "page_view",
  "product_view",
  "category_view",
  "brand_view",
  "whatsapp_click_header",
  "whatsapp_click_product",
  "whatsapp_click_basket",
  "phone_click",
  "search_query",
  "contact_form_submit",
  "product_add_to_request",
] as const;

export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

const EVENT_SET = new Set<string>(TRACKED_EVENTS);
export function isTrackedEvent(x: unknown): x is TrackedEvent {
  return typeof x === "string" && EVENT_SET.has(x);
}

export interface IncomingEvent {
  event: TrackedEvent;
  /** product or brand slug, when relevant */
  slug?: string;
  /** category slug, when relevant */
  category?: string;
}

const DAILY_TTL_SECONDS = 60 * 60 * 24 * 130; // ~130 days retention for daily hashes

/** Date key in Israel time, e.g. "2026-07-14". */
export function dayKey(d = new Date()): string {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d);
}

export function recentDayKeys(days: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = 0; i < days; i++) {
    out.push(dayKey(new Date(now - i * 86400000)));
  }
  return out; // index 0 = today
}

function sanitizeSlug(s: string | undefined): string | null {
  if (!s) return null;
  const clean = s.slice(0, 120).replace(/[\s\r\n]/g, "");
  return clean.length ? clean : null;
}

/**
 * Persist a batch of client events as atomic counters in one round-trip.
 * Fire-and-forget: callers must not block the UX on this promise.
 */
export async function recordEvents(events: IncomingEvent[]): Promise<void> {
  if (!isStoreConfigured() || events.length === 0) return;
  const today = dayKey();
  const cmds: (string | number)[][] = [];

  for (const e of events.slice(0, 20)) {
    if (!isTrackedEvent(e.event)) continue;
    cmds.push(["HINCRBY", "totals", e.event, 1]);
    cmds.push(["HINCRBY", `daily:${today}`, e.event, 1]);

    const slug = sanitizeSlug(e.slug);
    const category = sanitizeSlug(e.category);

    if (e.event === "category_view" && category) {
      cmds.push(["ZINCRBY", "z:cat", 1, category]);
    }
    if (e.event === "product_view") {
      if (slug) cmds.push(["ZINCRBY", "z:prod", 1, slug]);
      if (category) cmds.push(["ZINCRBY", "z:prodcat", 1, category]);
    }
    if (e.event === "brand_view" && slug) {
      cmds.push(["ZINCRBY", "z:brand", 1, slug]);
    }
    if (e.event === "whatsapp_click_product" && slug) {
      cmds.push(["ZINCRBY", "z:wa_prod", 1, slug]);
    }
  }

  if (cmds.length === 0) return;
  cmds.push(["EXPIRE", `daily:${today}`, DAILY_TTL_SECONDS]);
  cmds.push(["SET", "meta:lastEventAt", new Date().toISOString()]);
  await pipeline(cmds);
}

/* ------------------------------------------------------------------ */
/* Bots & AI-assistant detection (server-side, from request headers)  */
/* ------------------------------------------------------------------ */

export interface BotInfo {
  name: string;
  /** true for AI/LLM crawlers (as opposed to classic search engines). */
  ai: boolean;
}

// Ordered list; first substring match wins. `ai:true` = LLM/AI-assistant crawler.
const BOT_SIGNATURES: { match: string; name: string; ai: boolean }[] = [
  { match: "gptbot", name: "GPTBot (OpenAI)", ai: true },
  { match: "oai-searchbot", name: "OAI-SearchBot (OpenAI)", ai: true },
  { match: "chatgpt-user", name: "ChatGPT-User (OpenAI)", ai: true },
  { match: "claudebot", name: "ClaudeBot (Anthropic)", ai: true },
  { match: "claude-web", name: "Claude-Web (Anthropic)", ai: true },
  { match: "anthropic-ai", name: "Anthropic-AI", ai: true },
  { match: "perplexitybot", name: "PerplexityBot", ai: true },
  { match: "perplexity-user", name: "Perplexity-User", ai: true },
  { match: "google-extended", name: "Google-Extended (Gemini)", ai: true },
  { match: "googleother", name: "GoogleOther", ai: true },
  { match: "applebot-extended", name: "Applebot-Extended", ai: true },
  { match: "bytespider", name: "Bytespider (TikTok)", ai: true },
  { match: "ccbot", name: "CCBot (Common Crawl)", ai: true },
  { match: "amazonbot", name: "Amazonbot", ai: true },
  { match: "meta-externalagent", name: "Meta-ExternalAgent", ai: true },
  { match: "cohere-ai", name: "Cohere-AI", ai: true },
  { match: "youbot", name: "YouBot", ai: true },
  { match: "diffbot", name: "Diffbot", ai: true },
  { match: "mistralai", name: "MistralAI-User", ai: true },
  { match: "googlebot", name: "Googlebot", ai: false },
  { match: "bingbot", name: "Bingbot", ai: false },
  { match: "duckduckbot", name: "DuckDuckBot", ai: false },
  { match: "yandexbot", name: "YandexBot", ai: false },
  { match: "baiduspider", name: "Baiduspider", ai: false },
  { match: "applebot", name: "Applebot", ai: false },
  { match: "petalbot", name: "PetalBot", ai: false },
  { match: "semrushbot", name: "SemrushBot", ai: false },
  { match: "ahrefsbot", name: "AhrefsBot", ai: false },
  { match: "facebookexternalhit", name: "facebookexternalhit", ai: false },
];

export function detectBot(userAgent: string): BotInfo | null {
  const ua = userAgent.toLowerCase();
  for (const sig of BOT_SIGNATURES) {
    if (ua.includes(sig.match)) return { name: sig.name, ai: sig.ai };
  }
  return null;
}

// Referrer hostnames that indicate a user arrived from an AI assistant answer.
const AI_REFERRERS: { match: string; source: string }[] = [
  { match: "chatgpt.com", source: "ChatGPT" },
  { match: "chat.openai.com", source: "ChatGPT" },
  { match: "openai.com", source: "OpenAI" },
  { match: "perplexity.ai", source: "Perplexity" },
  { match: "gemini.google.com", source: "Gemini" },
  { match: "bard.google.com", source: "Gemini" },
  { match: "claude.ai", source: "Claude" },
  { match: "copilot.microsoft.com", source: "Copilot" },
  { match: "you.com", source: "You.com" },
  { match: "poe.com", source: "Poe" },
  { match: "phind.com", source: "Phind" },
];

export function detectAiReferral(referer: string): string | null {
  if (!referer) return null;
  const r = referer.toLowerCase();
  for (const s of AI_REFERRERS) {
    if (r.includes(s.match)) return s.source;
  }
  return null;
}

/** Record a server-side hit: an AI/search bot crawl and/or an AI referral. */
export async function recordServerHit(params: { bot?: BotInfo | null; aiReferral?: string | null }): Promise<void> {
  if (!isStoreConfigured()) return;
  const today = dayKey();
  const cmds: (string | number)[][] = [];

  if (params.bot) {
    cmds.push(["HINCRBY", "bots", params.bot.name, 1]);
    cmds.push(["HINCRBY", `botsdaily:${today}`, params.bot.name, 1]);
    cmds.push(["EXPIRE", `botsdaily:${today}`, DAILY_TTL_SECONDS]);
    cmds.push(["HINCRBY", "totals", params.bot.ai ? "bot_ai_crawl" : "bot_search_crawl", 1]);
  }
  if (params.aiReferral) {
    cmds.push(["HINCRBY", "airefs", params.aiReferral, 1]);
    cmds.push(["HINCRBY", "totals", "ai_referral_visit", 1]);
  }
  if (cmds.length === 0) return;
  await pipeline(cmds);
}

/* ------------------------------------------------------------------ */
/* Dashboard read model                                               */
/* ------------------------------------------------------------------ */

export interface RankedEntry {
  slug: string;
  count: number;
}

export interface DailyPoint {
  date: string;
  events: Record<string, number>;
}

export interface DashboardData {
  configured: boolean;
  lastEventAt: string | null;
  totals: Record<string, number>;
  daily: DailyPoint[]; // oldest -> newest
  topCategories: RankedEntry[];
  topProductCategories: RankedEntry[];
  topProducts: RankedEntry[];
  topWhatsappProducts: RankedEntry[];
  topBrands: RankedEntry[];
  bots: RankedEntry[];
  aiReferrals: RankedEntry[];
}

function toRanked(raw: unknown): RankedEntry[] {
  return parseZsetWithScores(raw).map((e) => ({ slug: e.member, count: e.score }));
}

function hashToRanked(raw: unknown): RankedEntry[] {
  const map = parseHashNumbers(raw);
  return Object.entries(map)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getDashboardData(days = 30): Promise<DashboardData> {
  const empty: DashboardData = {
    configured: false,
    lastEventAt: null,
    totals: {},
    daily: [],
    topCategories: [],
    topProductCategories: [],
    topProducts: [],
    topWhatsappProducts: [],
    topBrands: [],
    bots: [],
    aiReferrals: [],
  };
  if (!isStoreConfigured()) return empty;

  const dayKeys = recentDayKeys(days); // 0 = today
  const cmds: (string | number)[][] = [
    ["HGETALL", "totals"],
    ["GET", "meta:lastEventAt"],
    ["ZREVRANGE", "z:cat", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:prodcat", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:prod", 0, 19, "WITHSCORES"],
    ["ZREVRANGE", "z:wa_prod", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:brand", 0, 14, "WITHSCORES"],
    ["HGETALL", "bots"],
    ["HGETALL", "airefs"],
    ...dayKeys.map((d) => ["HGETALL", `daily:${d}`] as (string | number)[]),
  ];

  const res = await pipeline(cmds);
  if (!res) return empty;

  const daily: DailyPoint[] = dayKeys
    .map((date, i) => ({ date, events: parseHashNumbers(res[10 + i]) }))
    .reverse(); // oldest -> newest

  return {
    configured: true,
    totals: parseHashNumbers(res[0]),
    lastEventAt: typeof res[1] === "string" ? (res[1] as string) : null,
    topCategories: toRanked(res[2]),
    topProductCategories: toRanked(res[3]),
    topProducts: toRanked(res[4]),
    topWhatsappProducts: toRanked(res[5]),
    topBrands: toRanked(res[6]),
    bots: hashToRanked(res[7]),
    aiReferrals: hashToRanked(res[8]),
    daily,
  };
}

/** Cheap connectivity probe for the dashboard's status line. */
export async function storePing(): Promise<boolean> {
  if (!isStoreConfigured()) return false;
  const r = await redis("PING");
  return r === "PONG" || r === "pong";
}

/* ------------------------------------------------------------------ */
/* Rate limiting (brute-force / abuse protection)                     */
/* ------------------------------------------------------------------ */

// Per-instance fallback used only when the KV store isn't configured. Keyed by
// the full rate-limit key so different buckets never collide.
const memoryHits = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window limiter. `bucket` namespaces the limit (e.g. "login",
 * "contact"), `id` is usually the client IP. Returns true when the caller is
 * OVER the limit and should be blocked.
 *
 * Uses the shared Redis store when available (limits hold across serverless
 * instances); otherwise falls back to a best-effort in-memory window.
 */
export async function hitRateLimit(bucket: string, id: string, limit: number, windowSec: number): Promise<boolean> {
  const key = `rl:${bucket}:${id || "unknown"}`;

  if (!isStoreConfigured()) {
    const now = Date.now();
    const entry = memoryHits.get(key);
    if (!entry || entry.resetAt < now) {
      memoryHits.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  }

  const res = await pipeline([["INCR", key]]);
  const count = Number(res?.[0] ?? 0);
  if (count === 1) await redis("EXPIRE", key, windowSec);
  return count > limit;
}

/** Clear a limiter bucket for an id (e.g. after a successful login). */
export async function clearRateLimit(bucket: string, id: string): Promise<void> {
  const key = `rl:${bucket}:${id || "unknown"}`;
  if (!isStoreConfigured()) {
    memoryHits.delete(key);
    return;
  }
  await redis("DEL", key);
}

/** @deprecated Use hitRateLimit("login", ip, …). Kept for existing callers. */
export function hitLoginRateLimit(ip: string, limit = 5, windowSec = 60): Promise<boolean> {
  return hitRateLimit("login", ip, limit, windowSec);
}

/** @deprecated Use clearRateLimit("login", ip). */
export function clearLoginRateLimit(ip: string): Promise<void> {
  return clearRateLimit("login", ip);
}
