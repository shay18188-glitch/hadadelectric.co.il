import { NextResponse } from "next/server";
import { recordEvents, isTrackedEvent, storePing, type IncomingEvent } from "@/lib/analytics/events";
import { isStoreConfigured } from "@/lib/analytics/store";

// Lightweight, edge-run fire-and-forget collector. Clients call this with
// navigator.sendBeacon, so its latency never affects the page. When the KV
// store isn't configured, recordEvents silently no-ops.
export const runtime = "edge";

// Safe health check (no analytics data): confirms whether the store is wired
// up and reachable. Used to verify the Redis connection in production.
export async function GET() {
  const configured = isStoreConfigured();
  const connected = configured ? await storePing() : false;
  return NextResponse.json({ ok: true, configured, connected });
}

export async function POST(req: Request) {
  try {
    const data = (await req.json().catch(() => null)) as
      | { events?: unknown[]; event?: unknown; slug?: unknown; category?: unknown }
      | null;
    if (!data) return new NextResponse(null, { status: 204 });

    const raw = Array.isArray(data.events) ? data.events : data.event ? [data] : [];
    const events: IncomingEvent[] = [];
    for (const item of raw.slice(0, 20)) {
      const e = item as { event?: unknown; slug?: unknown; category?: unknown };
      if (!isTrackedEvent(e.event)) continue;
      events.push({
        event: e.event,
        slug: typeof e.slug === "string" ? e.slug : undefined,
        category: typeof e.category === "string" ? e.category : undefined,
      });
    }
    if (events.length > 0) await recordEvents(events);
  } catch {
    // Never surface tracking errors.
  }
  return new NextResponse(null, { status: 204 });
}
