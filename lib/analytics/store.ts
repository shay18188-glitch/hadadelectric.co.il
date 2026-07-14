/**
 * Server-side only (imported by Node-runtime route handlers, the Node-runtime
 * proxy, and the admin RSC — never by client components, which only POST to
 * /api/track).
 *
 * Talks to Redis over a normal TCP connection via node-redis. This is what
 * Vercel's managed Redis provides (a rediss:// REDIS_URL) — it has no HTTP REST
 * endpoint, so an edge/REST client can't reach it. All analytics writers run on
 * the Node.js runtime, so a shared, lazily-connected client works well and is
 * reused across warm invocations.
 *
 * Never throws to callers and never blocks the site: if the store isn't
 * configured or a command fails, reads return null and writes silently no-op.
 */
import { createClient } from "redis";

type Client = ReturnType<typeof createClient>;

function redisUrl(): string | null {
  return process.env.REDIS_URL || process.env.KV_URL || process.env.UPSTASH_REDIS_URL || null;
}

export function isStoreConfigured(): boolean {
  return redisUrl() !== null;
}

let client: Client | null = null;
let connecting: Promise<Client | null> | null = null;

async function getClient(): Promise<Client | null> {
  const url = redisUrl();
  if (!url) return null;
  if (client && client.isOpen) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      const c = createClient({
        url,
        socket: { connectTimeout: 5000, reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
      });
      // Swallow transient errors so a blip never throws into request handling.
      c.on("error", () => {});
      await c.connect();
      client = c;
      return client;
    } catch {
      client = null;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

/** Run a single Redis command (low-level, RESP2 replies). Null on failure. */
export async function redis(...command: (string | number)[]): Promise<unknown> {
  try {
    const c = await getClient();
    if (!c) return null;
    return await c.sendCommand(command.map(String));
  } catch {
    return null;
  }
}

/**
 * Run many commands, auto-pipelined by node-redis (batched in one tick).
 * Returns results in order, or null on failure. Writes are fire-and-forget on
 * the UX path (beacon / waitUntil), so their latency never affects the page.
 */
export async function pipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  if (commands.length === 0) return null;
  try {
    const c = await getClient();
    if (!c) return null;
    return await Promise.all(commands.map((cmd) => c.sendCommand(cmd.map(String))));
  } catch {
    return null;
  }
}

/** Parse an HGETALL reply (RESP2 flat array, or an object) into a number map. */
export function parseHashNumbers(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) {
      out[String(raw[i])] = Number(raw[i + 1]) || 0;
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      out[k] = Number(v) || 0;
    }
  }
  return out;
}

/** Parse a ZRANGE … WITHSCORES reply (flat array, or array of {value,score}). */
export function parseZsetWithScores(raw: unknown): { member: string; score: number }[] {
  const out: { member: string; score: number }[] = [];
  if (!Array.isArray(raw) || raw.length === 0) return out;
  if (typeof raw[0] === "object" && raw[0] !== null) {
    for (const item of raw) {
      const o = item as { value?: unknown; member?: unknown; score?: unknown };
      out.push({ member: String(o.value ?? o.member ?? ""), score: Number(o.score) || 0 });
    }
  } else {
    for (let i = 0; i + 1 < raw.length; i += 2) {
      out.push({ member: String(raw[i]), score: Number(raw[i + 1]) || 0 });
    }
  }
  return out;
}

/**
 * Which known connection env var names are present (names only, never values)
 * plus how the connection resolved. Safe to surface in authed diagnostics.
 */
export function getStoreEnvStatus(): { configured: boolean; source: string | null; present: Record<string, boolean> } {
  const present = {
    REDIS_URL: Boolean(process.env.REDIS_URL),
    KV_URL: Boolean(process.env.KV_URL),
    UPSTASH_REDIS_URL: Boolean(process.env.UPSTASH_REDIS_URL),
    KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
    UPSTASH_REDIS_REST_URL: Boolean(process.env.UPSTASH_REDIS_REST_URL),
  };
  let source: string | null = null;
  if (process.env.REDIS_URL) source = "REDIS_URL";
  else if (process.env.KV_URL) source = "KV_URL";
  else if (process.env.UPSTASH_REDIS_URL) source = "UPSTASH_REDIS_URL";
  return { configured: redisUrl() !== null, source, present };
}
