/**
 * Records which product URLs have existed, so a model leaving the feed does not
 * silently become a 404.
 *
 * 82% of this site's clicks arrive on queries too rare for Search Console to
 * name — overwhelmingly exact model numbers. A URL that has earned rankings on
 * one of those is worth something, and when the supplier drops the model the
 * catalog simply stops returning it and the page 404s, taking the ranking with
 * it. There is no other record: the catalog is fetched live and keeps no
 * history.
 *
 * This writes that history. The route reads it to tell a genuinely unknown
 * slug (404) apart from a model that used to exist (a page that says so and
 * offers what replaced it).
 *
 *   npx tsx scripts/snapshot-catalog.mts          # merge today's catalog in
 *   npx tsx scripts/snapshot-catalog.mts --check  # report drift, write nothing
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Base44CatalogResponseSchema } from "../types/api";
import { normalizeProduct } from "../lib/normalize";

const OUT = path.join(process.cwd(), "content/catalogSnapshot.json");
const CHECK = process.argv.includes("--check");
const appId = process.env.NEXT_PUBLIC_BASE44_APP_ID || "697dbf6bdde569f5ea050a4e";
const endpoint =
  (process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${appId}`) + "/functions/getProductCatalog";

interface SnapshotEntry {
  slug: string;
  name: string;
  categorySlug: string | null;
  modelNumber: string;
  /** ISO date the slug was last seen in the live feed. */
  lastSeen: string;
}

async function main() {
  const res = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(90_000) });
  const parsed = Base44CatalogResponseSchema.safeParse(await res.json());
  if (!parsed.success || !parsed.data.success) throw new Error("catalog response invalid");

  // Drop the records the per-product schema could not read.
  const live = parsed.data.data.filter((product) => product !== null).map(normalizeProduct);
  const today = new Date().toISOString().slice(0, 10);

  const previous: Record<string, SnapshotEntry> = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, "utf8")).entries ?? {}
    : {};

  const liveSlugs = new Set(live.map((p) => p.slug));
  const gone = Object.keys(previous).filter((slug) => !liveSlugs.has(slug));
  const added = live.filter((p) => !previous[p.slug]).map((p) => p.slug);

  console.log(`live: ${live.length}   known: ${Object.keys(previous).length}`);
  console.log(`new this run: ${added.length}`);
  console.log(`no longer in the feed: ${gone.length}`);
  if (gone.length) gone.slice(0, 20).forEach((s) => console.log(`   gone: ${s}`));

  if (CHECK) return;

  // Merge, never prune: an entry that leaves the feed is exactly what this file
  // exists to remember. `lastSeen` only moves forward for slugs still live.
  const merged: Record<string, SnapshotEntry> = { ...previous };
  for (const p of live) {
    merged[p.slug] = {
      slug: p.slug,
      name: p.name,
      categorySlug: p.categorySlug,
      modelNumber: p.modelNumber,
      lastSeen: today,
    };
  }

  const sorted = Object.keys(merged)
    .sort()
    .reduce<Record<string, SnapshotEntry>>((acc, k) => ((acc[k] = merged[k]), acc), {});

  writeFileSync(OUT, JSON.stringify({ generated: today, entries: sorted }, null, 1) + "\n");
  console.log(`✓ snapshot written: ${Object.keys(sorted).length} slugs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
