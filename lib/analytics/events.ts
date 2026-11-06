// Server-side module (route handlers, middleware, admin RSC). Not imported by
// client components — the client only sends events via /api/track.
import { pipeline, redis, parseHashNumbers, parseZsetWithScores, isStoreConfigured } from "@/lib/analytics/store";
import { isLandingType, isTrafficSource, type LandingType, type TrafficSource } from "@/lib/analytics/landing";

/** Business events we persist. Kept in sync with the client allowlist. */
export const TRACKED_EVENTS = [
  "page_view",
  "product_view",
  "category_view",
  "brand_view",
  "bundle_view",
  "bundle_add_to_request",
  "whatsapp_click_header",
  "whatsapp_click_product",
  "whatsapp_click_basket",
  "phone_click",
  "search_query",
  "search_open",
  "search_shortcut_click",
  "search_result_click",
  "contact_form_submit",
  "product_add_to_request",
  "exit_offer_view",
  "exit_offer_submit",
  "exit_offer_whatsapp",
  "exit_offer_dismiss",
] as const;

export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

const EVENT_SET = new Set<string>(TRACKED_EVENTS);
export function isTrackedEvent(x: unknown): x is TrackedEvent {
  return typeof x === "string" && EVENT_SET.has(x);
}

/**
 * Where on the page an action was taken. Only the mobile bottom bars send one,
 * so their use can be measured apart from the same action elsewhere.
 */
export const BAR_PLACEMENTS = ["bottom_bar", "product_bar"] as const;
export type BarPlacement = (typeof BAR_PLACEMENTS)[number];
export function isBarPlacement(x: unknown): x is BarPlacement {
  return typeof x === "string" && (BAR_PLACEMENTS as readonly string[]).includes(x);
}

/** A site path such as "/guides/oven-dimensions" — never a query or free text. */
export function sanitizePagePath(x: unknown): string | undefined {
  if (typeof x !== "string" || x.length > 120) return undefined;
  return /^\/[a-z0-9\-/]*$/i.test(x) ? x : undefined;
}

/** Bottom-bar actions that are an attempt to reach the shop. */
const BAR_CONTACT_EVENTS: ReadonlySet<string> = new Set(["whatsapp_click_header", "phone_click"]);

export interface IncomingEvent {
  event: TrackedEvent;
  /** product or brand slug, when relevant */
  slug?: string;
  /** category slug, when relevant */
  category?: string;
  /** Template the visit started on, for conversion attribution. */
  landing?: LandingType;
  /** Engine or channel the visit arrived from. */
  source?: TrafficSource;
  /** Set only by the mobile bottom bars. */
  placement?: BarPlacement;
  /** Path the bar was used on (bottom bar only). */
  page?: string;
}

/**
 * The events that mean someone tried to reach the shop. Only these carry the
 * landing/source dimensions: attributing a page view tells you nothing you
 * cannot already read in Search Console, while attributing an enquiry answers
 * which content actually earns one.
 */
const CONVERSION_EVENTS: ReadonlySet<string> = new Set([
  "whatsapp_click_header",
  "whatsapp_click_product",
  "whatsapp_click_basket",
  "phone_click",
  "contact_form_submit",
  "product_add_to_request",
  "bundle_add_to_request",
  "exit_offer_submit",
  "exit_offer_whatsapp",
]);

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
    if (e.event === "bundle_view" && slug) {
      cmds.push(["ZINCRBY", "z:bundle", 1, slug]);
    }
    if (e.event === "whatsapp_click_product" && slug) {
      cmds.push(["ZINCRBY", "z:wa_prod", 1, slug]);
    }

    // Bottom-bar use is counted in its own hashes, so the site-wide totals and
    // the activity trend are unchanged by it (no double counting).
    if (isBarPlacement(e.placement)) {
      const field = `${e.placement}:${e.event}`;
      cmds.push(["HINCRBY", "bar", field, 1]);
      cmds.push(["HINCRBY", `bardaily:${today}`, field, 1]);
      cmds.push(["EXPIRE", `bardaily:${today}`, DAILY_TTL_SECONDS]);
      const page = e.placement === "bottom_bar" ? sanitizePagePath(e.page) : undefined;
      if (page && e.event === "search_open") cmds.push(["ZINCRBY", "z:bar_search_page", 1, page]);
      if (page && BAR_CONTACT_EVENTS.has(e.event)) cmds.push(["ZINCRBY", "z:bar_contact_page", 1, page]);
    }

    if (CONVERSION_EVENTS.has(e.event)) {
      cmds.push(["HINCRBY", "totals", "conversion", 1]);
      cmds.push(["HINCRBY", `daily:${today}`, "conversion", 1]);
      if (isLandingType(e.landing)) cmds.push(["ZINCRBY", "z:conv_landing", 1, e.landing]);
      if (isTrafficSource(e.source)) cmds.push(["ZINCRBY", "z:conv_source", 1, e.source]);
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
  /** Enquiries bucketed by the template the visit started on. */
  conversionsByLanding: RankedEntry[];
  /** Enquiries bucketed by the engine or channel the visit arrived from. */
  conversionsBySource: RankedEntry[];
  bots: RankedEntry[];
  aiReferrals: RankedEntry[];
  /** Mobile bottom bars, keyed "placement:event". */
  bar: { total: Record<string, number>; last7: Record<string, number>; last30: Record<string, number> };
  /** Pages where the bottom bar's search was opened most. */
  barSearchPages: RankedEntry[];
  /** Pages where the bottom bar's WhatsApp/call was tapped most. */
  barContactPages: RankedEntry[];
}

function sumDays(days: Record<string, number>[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const day of days) {
    for (const [k, v] of Object.entries(day)) out[k] = (out[k] ?? 0) + v;
  }
  return out;
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
    conversionsByLanding: [],
    conversionsBySource: [],
    bots: [],
    aiReferrals: [],
    bar: { total: {}, last7: {}, last30: {} },
    barSearchPages: [],
    barContactPages: [],
  };
  if (!isStoreConfigured()) return empty;

  const dayKeys = recentDayKeys(days); // 0 = today
  const head: (string | number)[][] = [
    ["HGETALL", "totals"],
    ["GET", "meta:lastEventAt"],
    ["ZREVRANGE", "z:cat", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:prodcat", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:prod", 0, 19, "WITHSCORES"],
    ["ZREVRANGE", "z:wa_prod", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:brand", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:conv_landing", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:conv_source", 0, 14, "WITHSCORES"],
    ["HGETALL", "bots"],
    ["HGETALL", "airefs"],
  ];
  // Offsets are derived from the lists themselves: a hard-coded "12" here once
  // read every day's counters one slot late (today always empty).
  const dailyBase = head.length;
  const barBase = dailyBase + dayKeys.length;
  const cmds: (string | number)[][] = [
    ...head,
    ...dayKeys.map((d) => ["HGETALL", `daily:${d}`] as (string | number)[]),
    ["HGETALL", "bar"],
    ["ZREVRANGE", "z:bar_search_page", 0, 14, "WITHSCORES"],
    ["ZREVRANGE", "z:bar_contact_page", 0, 14, "WITHSCORES"],
    ...dayKeys.map((d) => ["HGETALL", `bardaily:${d}`] as (string | number)[]),
  ];

  const res = await pipeline(cmds);
  if (!res) return empty;

  const daily: DailyPoint[] = dayKeys
    .map((date, i) => ({ date, events: parseHashNumbers(res[dailyBase + i]) }))
    .reverse(); // oldest -> newest

  const barDaily = dayKeys.map((_, i) => parseHashNumbers(res[barBase + 3 + i])); // 0 = today

  return {
    configured: true,
    totals: parseHashNumbers(res[0]),
    lastEventAt: typeof res[1] === "string" ? (res[1] as string) : null,
    topCategories: toRanked(res[2]),
    topProductCategories: toRanked(res[3]),
    topProducts: toRanked(res[4]),
    topWhatsappProducts: toRanked(res[5]),
    topBrands: toRanked(res[6]),
    conversionsByLanding: toRanked(res[7]),
    conversionsBySource: toRanked(res[8]),
    bots: hashToRanked(res[9]),
    aiReferrals: hashToRanked(res[10]),
    daily,
    bar: {
      total: parseHashNumbers(res[barBase]),
      last7: sumDays(barDaily.slice(0, 7)),
      last30: sumDays(barDaily),
    },
    barSearchPages: toRanked(res[barBase + 1]),
    barContactPages: toRanked(res[barBase + 2]),
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
