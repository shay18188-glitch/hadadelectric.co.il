/**
 * Pairs a guide with the bundle that turns its advice into a basket.
 *
 * The two page types cover the same ground and never referenced each other —
 * no link in either direction, in content or in the rendered page. Search
 * Console shows what that costs: /guides/young-couple-appliance-package takes
 * 289 impressions at position 18.56 and a 6.23% click rate, while
 * /bundles/young-couples-first-home, on the same subject, sits at 33.14 on 56
 * impressions with one click. The informational page wins the query and then
 * drops the reader, and the commercial page it should hand off to is invisible.
 *
 * The pairing is editorial, not derivable from slugs: a bundle belongs here
 * only when it is genuinely the package for what the guide explains. Unpaired
 * guides and bundles render nothing extra.
 */
export interface GuideBundlePair {
  guideSlug: string;
  bundleSlug: string;
}

export const GUIDE_BUNDLE_PAIRS: GuideBundlePair[] = [
  { guideSlug: "young-couple-appliance-package", bundleSlug: "young-couples-first-home" },
  { guideSlug: "new-apartment-appliances-checklist", bundleSlug: "first-kitchen-appliances" },
  { guideSlug: "how-to-choose-a-washing-machine", bundleSlug: "complete-laundry-room" },
  { guideSlug: "dryer-condenser-vs-heat-pump", bundleSlug: "complete-laundry-room" },
  { guideSlug: "washing-machine-dimensions", bundleSlug: "complete-laundry-room" },
  { guideSlug: "dryer-dimensions", bundleSlug: "complete-laundry-room" },
];

export function bundleSlugForGuide(guideSlug: string): string | null {
  return GUIDE_BUNDLE_PAIRS.find((p) => p.guideSlug === guideSlug)?.bundleSlug ?? null;
}

export function guideSlugsForBundle(bundleSlug: string): string[] {
  return GUIDE_BUNDLE_PAIRS.filter((p) => p.bundleSlug === bundleSlug).map((p) => p.guideSlug);
}
