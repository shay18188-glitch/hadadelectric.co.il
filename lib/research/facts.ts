import type { PublishedResearch } from "@/lib/research/schema";

/**
 * Product weight in kilograms, read from the verified dimensions group.
 *
 * Only an unambiguous single figure counts: "33 ק״ג" → 33. A row that gives
 * a range, a with-stand figure or a packaged weight is not the product's
 * weight and returns null rather than a guess.
 */
export function researchWeightKg(research: PublishedResearch): number | null {
  const group = research.specGroups.find((g) => g.id === "dimensions");
  const row = group?.rows.find((r) => /^משקל(\s*(נטו|המכשיר|ללא מעמד))?$/.test(r.label.trim()));
  if (!row) return null;
  const match = row.value.match(/^\s*(\d+(?:[.,]\d+)?)\s*(ק["״]?ג|kg)\s*$/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}
