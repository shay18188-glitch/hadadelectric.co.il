/**
 * Aggregates the live catalog so a "מידות" guide can be written from measured
 * numbers instead of category folklore.
 *
 * Every claim in content/guides.dimensions.ts must be either derived geometry
 * or an aggregate over real records. This produces the second kind: per group,
 * how many products exist, how many publish a parseable measurement, and the
 * width / height / depth ranges across those that do.
 *
 * Reads the feed directly rather than through lib/base44/catalog, which is
 * server-only — same approach as seo-dimensions-audit.mts.
 *
 *   npx tsx scripts/seo-dimension-stats.mts           # every group
 *   npx tsx scripts/seo-dimension-stats.mts --cats    # category names only
 */
import { Base44CatalogResponseSchema } from "../types/api";
import type { Base44Product } from "../types/api";
import { extractDimensions } from "../lib/seo/dimensions";

const appId = process.env.NEXT_PUBLIC_BASE44_APP_ID || "697dbf6bdde569f5ea050a4e";
const endpoint =
  (process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${appId}`) + "/functions/getProductCatalog";

interface Group {
  label: string;
  category: string;
  match?: RegExp;
  maxHeightCm?: number;
}

const GROUPS: Group[] = [
  { label: "מקררים — הכל", category: "מקררים" },
  { label: "מקררים 4 דלתות", category: "מקררים", match: /(^|\s)(4|ארבע)\s*דלתות(\s|$)/ },
  { label: "מקררים מקפיא תחתון", category: "מקררים", match: /מקפיא תחתון/ },
  { label: "מקררים מקפיא עליון", category: "מקררים", match: /מקפיא עליון/ },
  { label: "מקררים סייד ביי סייד", category: "מקררים", match: /סייד|side/i },
  { label: "מכונות כביסה — הכל", category: "מכונות כביסה" },
  { label: "מכונות כביסה 7 ק״ג", category: "מכונות כביסה", match: /(^|\D)7\s*(קג|ק"ג|ק״ג|kg)/i },
  { label: "מכונות כביסה 8 ק״ג", category: "מכונות כביסה", match: /(^|\D)8\s*(קג|ק"ג|ק״ג|kg)/i },
  { label: "מכונות כביסה 9 ק״ג", category: "מכונות כביסה", match: /(^|\D)9\s*(קג|ק"ג|ק״ג|kg)/i },
  { label: "מכונות כביסה 10 ק״ג", category: "מכונות כביסה", match: /(^|\D)10\s*(קג|ק"ג|ק״ג|kg)/i },
  { label: "מייבשים — הכל", category: "מייבשי כביסה" },
  { label: "מייבשים משאבת חום", category: "מייבשי כביסה", match: /היט פאמפ|משאבת חום|heat\s*pump/i },
  { label: "מייבשים קונדנסור", category: "מייבשי כביסה", match: /קונדנסור|condenser/i },
  { label: "מדיחים — הכל", category: "מדיחי כלים" },
  { label: "מדיחים אינטגרליים", category: "מדיחי כלים", match: /אינטגרלי/ },
  { label: "מדיחים צרים 45", category: "מדיחי כלים", match: /45/ },
];

function r1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
function fmtRange(values: number[]): string {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0);
  if (!clean.length) return "—";
  const lo = Math.min(...clean);
  const hi = Math.max(...clean);
  return lo === hi ? `${r1(lo)}` : `${r1(lo)}–${r1(hi)}`;
}
function median(values: number[]): string {
  const s = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!s.length) return "—";
  const mid = Math.floor(s.length / 2);
  return r1(s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2);
}

async function load(): Promise<Base44Product[]> {
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(90_000),
  });
  const parsed = Base44CatalogResponseSchema.safeParse(await response.json());
  if (!parsed.success || !parsed.data.success) throw new Error("catalog response invalid");
  // Drop the records the per-product schema could not read.
  return parsed.data.data.filter((product) => product !== null);
}

async function main() {
  const products = await load();
  console.log(`catalog: ${products.length} products\n`);

  if (process.argv.includes("--cats")) {
    const counts = new Map<string, number>();
    for (const p of products) {
      const c = p.category?.trim() || "—";
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([c, n]) => console.log(`  ${String(n).padStart(4)}  ${c}`));
    return;
  }

  for (const group of GROUPS) {
    const matching = products.filter((p) => {
      if ((p.category?.trim() || "") !== group.category) return false;
      if (group.match && !group.match.test(p.name)) return false;
      return true;
    });
    const bodies = matching
      .map((p) => extractDimensions(p.technical_specifications ?? "", { panelSize: null }))
      .map((d) => d?.primary ?? d?.withStand ?? null)
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .filter((d) => !group.maxHeightCm || d.heightCm <= group.maxHeightCm);

    const inStock = matching.filter((p) => p.is_available === true).length;
    console.log(`${group.label}`);
    console.log(`  products ${matching.length}  in-stock ${inStock}  measured ${bodies.length}`);
    if (bodies.length) {
      const w = bodies.map((b) => b.widthCm);
      const h = bodies.map((b) => b.heightCm);
      const d = bodies.map((b) => b.depthCm);
      console.log(`  width  ${fmtRange(w)} cm   (median ${median(w)})`);
      console.log(`  height ${fmtRange(h)} cm   (median ${median(h)})`);
      console.log(`  depth  ${fmtRange(d)} cm   (median ${median(d)})`);
    }
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
