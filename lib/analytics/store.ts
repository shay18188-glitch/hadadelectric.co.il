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

function getConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function isStoreConfigured(): boolean {
  return getConfig() !== null;
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
