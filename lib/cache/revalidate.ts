import { revalidateTag } from "next/cache";

/**
 * Call this from an authenticated API route (e.g. /app/api/revalidate/route.ts)
 * triggered by a Base44 webhook when the catalog changes, to bust the
 * `catalog` fetch cache before the next 30-minute ISR window.
 *
 * TODO: wire a Base44 outgoing webhook to POST /api/revalidate with a
 * shared secret once available, instead of relying solely on the
 * time-based revalidate window.
 */
export function revalidateCatalog(): void {
  revalidateTag("catalog", "max");
}
