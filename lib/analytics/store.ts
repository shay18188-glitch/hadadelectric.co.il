/**
 * Server-side only (imported by route handlers, middleware and the admin RSC —
 * never by client components, which only POST to /api/track).
 *
 * Minimal, dependency-free client for Upstash Redis / Vercel KV over its REST
 * API. Used to persist lightweight business-analytics counters.
 *
 * Design goals:
 * - No npm dependency (plain fetch), so nothing to install.
 * - Never throws to callers and never blocks the site: if the store isn't
 *   configured or a request fails, reads return null and writes silently no-op.
 * - Works with both Vercel KV env names (KV_REST_API_URL / KV_REST_API_TOKEN)
 *   and native Upstash names (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
 */

/**
 * Derive REST credentials from a redis:// connection URL (Upstash only, which
 * is what Vercel's Redis/KV integration provisions). Upstash uses the same
 * token for its TCP password and REST bearer, and its REST endpoint is just
 * https://<host>. This lets the store work even when only REDIS_URL / KV_URL
 * is set, without needing a TCP client (which edge can't use).
 */
function fromRedisUrl(raw: string | undefined): { url: string; token: string } | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!u.hostname.endsWith("upstash.io")) return null;
    const token = decodeURIComponent(u.password || "");
    if (!token) return null;
    return { url: `https://${u.hostname}`, token };
  } catch {
    return null;
  }
}

function getConfig(): { url: string; token: string } | null {
  const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (restUrl && restToken) return { url: restUrl.replace(/\/$/, ""), token: restToken };

  return (
    fromRedisUrl(process.env.REDIS_URL) ||
    fromRedisUrl(process.env.KV_URL) ||
    fromRedisUrl(process.env.UPSTASH_REDIS_URL)
  );
}

export function isStoreConfigured(): boolean {
  return getConfig() !== null;
}

/**
 * Which known env var names are present (names only, never values) plus how the
 * connection was resolved. Safe to surface in the authed admin diagnostics.
 */
export function getStoreEnvStatus(): { configured: boolean; source: string | null; present: Record<string, boolean> } {
  const present = {
    KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
    KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN),
    UPSTASH_REDIS_REST_URL: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    UPSTASH_REDIS_REST_TOKEN: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    REDIS_URL: Boolean(process.env.REDIS_URL),
    KV_URL: Boolean(process.env.KV_URL),
    UPSTASH_REDIS_URL: Boolean(process.env.UPSTASH_REDIS_URL),
  };
  let source: string | null = null;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) source = "KV_REST_API_*";
  else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) source = "UPSTASH_REDIS_REST_*";
  else if (fromRedisUrl(process.env.REDIS_URL)) source = "REDIS_URL";
  else if (fromRedisUrl(process.env.KV_URL)) source = "KV_URL";
  else if (fromRedisUrl(process.env.UPSTASH_REDIS_URL)) source = "UPSTASH_REDIS_URL";
  return { configured: getConfig() !== null, source, present };
}

type RedisArg = string | number;
type Command = RedisArg[];

interface PipelineResult {
  result?: unknown;
  error?: string;
}

/** Run a single Redis command. Returns the raw result, or null on failure. */
export async function redis(...command: Command): Promise<unknown> {
  const cfg = getConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(command.map(String)),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PipelineResult;
    return json.result ?? null;
  } catch {
    return null;
  }
}

/**
 * Run many commands in a single round-trip. Returns the array of results
 * (same order), or null on failure. Writes should not be awaited on the UX
 * path — callers use fire-and-forget / waitUntil.
 */
export async function pipeline(commands: Command[]): Promise<unknown[] | null> {
  const cfg = getConfig();
  if (!cfg || commands.length === 0) return null;
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands.map((c) => c.map(String))),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PipelineResult[];
    return json.map((r) => r.result ?? null);
  } catch {
    return null;
  }
}

/** Parse an Upstash HGETALL flat array [f1,v1,f2,v2,...] into a number map. */
export function parseHashNumbers(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const field = String(raw[i]);
    const value = Number(raw[i + 1]);
    out[field] = Number.isFinite(value) ? value : 0;
  }
  return out;
}

/** Parse an Upstash ZRANGE ... WITHSCORES flat array into ranked entries. */
export function parseZsetWithScores(raw: unknown): { member: string; score: number }[] {
  const out: { member: string; score: number }[] = [];
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i + 1 < raw.length; i += 2) {
    out.push({ member: String(raw[i]), score: Number(raw[i + 1]) || 0 });
  }
  return out;
}
