import "server-only";

import snapshot from "@/content/catalogSnapshot.json";
import { getProducts } from "@/lib/base44/catalog";
import type { Product } from "@/types/product";

/**
 * Models that have left the feed, and what to offer instead.
 *
 * A product URL that ranked for its model number is worth keeping. 82% of this
 * site's clicks arrive on queries too rare for Search Console to name, almost
 * all of them exact models, so when a supplier drops one the 404 throws away a
 * ranking that took months to earn — and sends a visitor who was ready to buy
 * to an error page.
 *
 * `content/catalogSnapshot.json` records every slug the feed has ever served
 * (see scripts/snapshot-catalog.mts). A slug in the snapshot but absent from
 * today's catalog is a discontinued model, not a bad URL, and gets a page that
 * says so and lists what is in stock in its place. A slug in neither is still a
 * genuine 404.
 *
 * Nothing here claims a successor model: the alternatives are simply what the
 * category has in stock, ordered the way the related rail orders them. Naming
 * one model as "the replacement" would be a judgement the catalog does not
 * support.
 */

interface SnapshotEntry {
  slug: string;
  name: string;
  categorySlug: string | null;
  modelNumber: string;
  lastSeen: string;
}

const ENTRIES = (snapshot as { entries: Record<string, SnapshotEntry> }).entries;

export interface DiscontinuedProduct {
  name: string;
  modelNumber: string;
  categorySlug: string | null;
  lastSeen: string;
  alternatives: Product[];
}

export function wasEverPublished(slug: string): boolean {
  return Boolean(ENTRIES[slug]);
}

export async function getDiscontinued(slug: string, limit = 6): Promise<DiscontinuedProduct | null> {
  const entry = ENTRIES[slug];
  if (!entry) return null;

  const products = await getProducts();
  // If the feed has it again, this is not a discontinued page at all.
  if (products.some((p) => p.slug === slug)) return null;

  const sameCategory = entry.categorySlug
    ? products.filter((p) => p.categorySlug === entry.categorySlug)
    : [];
  const alternatives = [...sameCategory]
    .sort((a, b) => {
      const rank = (p: Product) => (p.availability === "in_stock" ? 0 : p.availability === "unknown" ? 1 : 2);
      return rank(a) - rank(b);
    })
    .slice(0, limit);

  return {
    name: entry.name,
    modelNumber: entry.modelNumber,
    categorySlug: entry.categorySlug,
    lastSeen: entry.lastSeen,
    alternatives,
  };
}
