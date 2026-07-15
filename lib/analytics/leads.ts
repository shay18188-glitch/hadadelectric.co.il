// Server-side only. Persists contact-form submissions ("leads") so the /admin
// dashboard can show and manage them. Stored in the same Redis store used for
// analytics; fails soft (never throws, never blocks the request path).
import { pipeline, redis, isStoreConfigured } from "@/lib/analytics/store";

export type LeadStatus = "new" | "handled";

export interface Lead {
  id: string;
  ts: number; // epoch ms
  name: string;
  phone: string;
  email: string;
  message: string;
  product: string; // relevantProduct
  status: LeadStatus;
}

export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  message: string;
  product?: string;
}

const INDEX_KEY = "leads:index"; // zset: score=ts, member=id (newest first via ZREVRANGE)
const MAX_LEADS = 1000; // hard cap on retained leads
const LEAD_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year retention per lead

function leadKey(id: string): string {
  return `lead:${id}`;
}

function clip(s: string | undefined, max: number): string {
  return (s ?? "").toString().slice(0, max);
}

/** Persist one lead. Returns the new id, or null when storage is unavailable. */
export async function recordLead(input: LeadInput): Promise<string | null> {
  if (!isStoreConfigured()) return null;
  const id = crypto.randomUUID();
  const ts = Date.now();
  const key = leadKey(id);

  const cmds: (string | number)[][] = [
    [
      "HSET",
      key,
      "id", id,
      "ts", String(ts),
      "name", clip(input.name, 100),
      "phone", clip(input.phone, 40),
      "email", clip(input.email, 150),
      "message", clip(input.message, 2000),
      "product", clip(input.product, 200),
      "status", "new",
    ],
    ["EXPIRE", key, LEAD_TTL_SECONDS],
    ["ZADD", INDEX_KEY, String(ts), id],
    // Keep only the newest MAX_LEADS index entries (drop the oldest overflow).
    ["ZREMRANGEBYRANK", INDEX_KEY, 0, -(MAX_LEADS + 1)],
  ];
  const res = await pipeline(cmds);
  return res ? id : null;
}

function parseHashStrings(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) out[String(raw[i])] = String(raw[i + 1]);
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) out[k] = String(v);
  }
  return out;
}

function toLead(h: Record<string, string>): Lead | null {
  if (!h.id) return null;
  return {
    id: h.id,
    ts: Number(h.ts) || 0,
    name: h.name ?? "",
    phone: h.phone ?? "",
    email: h.email ?? "",
    message: h.message ?? "",
    product: h.product ?? "",
    status: h.status === "handled" ? "handled" : "new",
  };
}

export interface LeadsResult {
  leads: Lead[];
  newCount: number;
}

/** Newest-first leads (up to `limit`). Prunes index entries whose hash expired. */
export async function getLeads(limit = 200): Promise<LeadsResult> {
  if (!isStoreConfigured()) return { leads: [], newCount: 0 };
  const ids = (await redis("ZREVRANGE", INDEX_KEY, 0, limit - 1)) as unknown;
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return { leads: [], newCount: 0 };

  const res = await pipeline(list.map((id) => ["HGETALL", leadKey(id)]));
  if (!res) return { leads: [], newCount: 0 };

  const leads: Lead[] = [];
  const expired: string[] = [];
  res.forEach((raw, i) => {
    const lead = toLead(parseHashStrings(raw));
    if (lead) leads.push(lead);
    else expired.push(list[i]); // hash gone (TTL) but index lingered
  });

  // Best-effort cleanup of stale index members.
  if (expired.length) await pipeline([["ZREM", INDEX_KEY, ...expired]]);

  leads.sort((a, b) => b.ts - a.ts);
  return { leads, newCount: leads.filter((l) => l.status === "new").length };
}

/** Set a lead's status — only if the lead still exists (never resurrects it). */
export async function setLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  if (!isStoreConfigured() || !id) return false;
  const exists = (await redis("EXISTS", leadKey(id))) as unknown;
  if (Number(exists) !== 1) return false;
  await redis("HSET", leadKey(id), "status", status);
  return true;
}

/** Permanently delete a lead. */
export async function deleteLead(id: string): Promise<boolean> {
  if (!isStoreConfigured() || !id) return false;
  await pipeline([["DEL", leadKey(id)], ["ZREM", INDEX_KEY, id]]);
  return true;
}
