import policy from "@/content/image-host-policy.json";

/**
 * Supplier hosts that refuse Vercel's image optimizer but serve a browser.
 *
 * The optimizer fetches from its own datacentre, and a number of Israeli
 * supplier sites answer that fetch with a 403 — Vercel then returns
 * OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED, the `<img>` errors, and the
 * page falls back to the local placeholder. The photo was never missing: 77
 * products across 12 hosts were showing a stock silhouette while their real
 * image sat one direct request away, reachable from any visitor's browser.
 *
 * For these hosts the optimizer is skipped and the supplier URL is used as
 * it is. That costs the AVIF/WebP conversion and the resize, which is the
 * right trade against showing no product at all — and it is scoped to the
 * hosts that actually need it, so the other 98 keep full optimization.
 *
 * Deciding this from the URL rather than from a prop means the server
 * renders the correct `<img>` first time, which matters for the crawlers
 * this catalog is built for: a bot that runs no JavaScript would otherwise
 * only ever see the URL that 502s.
 */
const BLOCKED_HOSTS: ReadonlySet<string> = new Set(policy.blockedFromOptimizer);

export function isOptimizerBlockedHost(src: string | null | undefined): boolean {
  if (!src || !src.startsWith("http")) return false;
  try {
    return BLOCKED_HOSTS.has(new URL(src).hostname);
  } catch {
    // An unparseable URL is not a host we know to be blocked; let the normal
    // path handle it and fail into the staged fallback if it must.
    return false;
  }
}
