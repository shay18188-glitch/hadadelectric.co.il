/**
 * Finds supplier hosts whose images Vercel's optimizer cannot fetch.
 *
 * Every product image is requested twice: once through the deployed
 * `/_next/image` endpoint, and once directly with browser headers. A host
 * that fails the first and passes the second is one where skipping the
 * optimizer restores a real photo, and it is written to
 * content/image-host-policy.json for `lib/images/optimizer.ts` to read.
 *
 * A host that fails both is a dead upstream image — no code change helps,
 * the record needs a new URL in Base44 — so those are reported separately
 * rather than silently bypassed.
 *
 * Run against production, since the optimizer's behaviour is what is being
 * measured:  npm run probe-image-hosts
 */
import { writeFile, readFile } from "node:fs/promises";
import { Base44CatalogResponseSchema } from "../types/api";
import { isPlaceholderImageUrl } from "../lib/normalize";

const appId = process.env.NEXT_PUBLIC_BASE44_APP_ID || "697dbf6bdde569f5ea050a4e";
const baseUrl = process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${appId}`;
const endpoint = `${baseUrl}/functions/getProductCatalog`;
const site = process.env.PROBE_SITE_ORIGIN || "https://hadadelectric.co.il";
const outputPath = new URL("../content/image-host-policy.json", import.meta.url);

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

/** One representative image URL per host — probing all 948 proves nothing extra. */
async function collectHosts(): Promise<Map<string, string>> {
  // Cache-bust: the endpoint sets max-age=300, and a stale body would hide
  // images added in the last few minutes.
  const res = await fetch(`${endpoint}?_cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
  const parsed = Base44CatalogResponseSchema.safeParse(await res.json());
  if (!parsed.success || !parsed.data.success) throw new Error("catalog response invalid");

  const byHost = new Map<string, string>();
  for (const product of parsed.data.data) {
    if (!product) continue;
    const urls = [
      product.primary_image,
      product.image_url,
      ...(product.gallery_images ?? []).filter((image) => image != null).map((image) => image.url),
    ];
    for (const url of urls) {
      // Skip the ones the site already discards: they serve a browser fine,
      // so they would be reported as worth bypassing when no image from
      // them ever reaches a page.
      if (!url || isPlaceholderImageUrl(url)) continue;
      try {
        const { hostname } = new URL(url);
        if (hostname && !byHost.has(hostname)) byHost.set(hostname, url);
      } catch {
        // Not a URL the site could render either; nothing to probe.
      }
    }
  }
  return byHost;
}

async function status(url: string, init?: RequestInit): Promise<{ code: number; type: string }> {
  try {
    const res = await fetch(url, { ...init, redirect: "follow", signal: AbortSignal.timeout(25_000) });
    return { code: res.status, type: res.headers.get("content-type") ?? "" };
  } catch {
    return { code: 0, type: "" };
  }
}

async function probe(host: string, sample: string) {
  const viaOptimizer = await status(
    `${site}/_next/image?url=${encodeURIComponent(sample)}&w=640&q=75`
  );
  if (viaOptimizer.code === 200) return { host, verdict: "ok" as const };

  const direct = await status(sample, {
    headers: { "User-Agent": BROWSER_UA, Referer: `${site}/`, "Sec-Fetch-Dest": "image" },
  });

  // Only a definitive "this file is gone" rules a host out. Anything else —
  // a 403, a timeout, a non-image body — is ambiguous from here, because
  // this probe is a server-side fetch and several of these hosts sit behind
  // Cloudflare, which refuses one of those while serving real browsers
  // normally. Measured: payngo answers this probe 403 and loads perfectly in
  // a browser, and it alone is 44 products.
  //
  // The asymmetry decides it. Bypassing a host whose image genuinely will
  // not load costs nothing — the staged fallback in ProductImage lands on
  // the same placeholder it would have shown anyway. Not bypassing one that
  // would have loaded costs a real product photo. So ambiguity bypasses.
  const definitelyGone = direct.code === 404 || direct.code === 410;
  return {
    host,
    verdict: definitelyGone ? ("dead" as const) : ("bypass" as const),
    optimizer: viaOptimizer.code,
    direct: direct.code,
  };
}

/** Bounded concurrency: this hits ~124 third-party hosts. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        out[index] = await fn(items[index]);
      }
    })
  );
  return out;
}

const hosts = await collectHosts();
console.log(`[image-hosts] probing ${hosts.size} hosts against ${site}`);

const results = await mapLimit([...hosts.entries()], 10, ([host, sample]) => probe(host, sample));

const bypass = results.filter((r) => r.verdict === "bypass").map((r) => r.host).sort();
const dead = results.filter((r) => r.verdict === "dead").sort((a, b) => a.host.localeCompare(b.host));

console.log(`\n[image-hosts] ${results.length - bypass.length - dead.length} ok, ${bypass.length} need bypass, ${dead.length} dead`);
if (bypass.length) console.log(`\nBYPASS (optimizer refused, browser fine):\n  ${bypass.join("\n  ")}`);
if (dead.length) {
  console.log(`\nDEAD upstream images (404/410) — these need a new URL in Base44, no code fix applies:`);
  for (const d of dead) console.log(`  ${d.host.padEnd(30)} optimizer=${d.optimizer} direct=${d.direct}`);
}

const previous = JSON.parse(await readFile(outputPath, "utf8")) as { blockedFromOptimizer: string[] };
if (JSON.stringify(previous.blockedFromOptimizer) === JSON.stringify(bypass)) {
  console.log("\n[image-hosts] policy unchanged");
} else {
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        _comment:
          "Hosts whose images Vercel's image optimizer cannot fetch, but a browser can. Regenerate with `npm run probe-image-hosts`.",
        generatedAt: new Date().toISOString().slice(0, 10),
        blockedFromOptimizer: bypass,
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  console.log("\n[image-hosts] policy updated");
}
