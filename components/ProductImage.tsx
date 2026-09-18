"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { isOptimizerBlockedHost } from "@/lib/images/optimizer";

const FALLBACK_IMAGE = "/images/product-placeholder-v2.webp";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
};

/**
 * How far this image has degraded.
 *
 * `optimized` is the normal path. `direct` loads the supplier URL as-is,
 * bypassing the optimizer. `placeholder` gives up and shows the local
 * silhouette.
 */
type Stage = "optimized" | "direct" | "placeholder";

/**
 * A product photo that degrades in steps instead of all at once.
 *
 * It used to treat any load error as "there is no image" and swap in the
 * placeholder. That conflated two very different failures: an image that
 * does not exist, and an image that exists but that Vercel's optimizer is
 * not allowed to fetch. The second is common here — several Israeli
 * supplier hosts answer the optimizer's datacentre request with a 403 while
 * serving the same file to any browser — and it was costing 77 products
 * their real photo in favour of a stock silhouette.
 *
 * So a failure now steps down rather than falling over: optimized, then the
 * supplier URL directly, then the placeholder. Hosts already known to
 * refuse the optimizer skip the first step, so the server emits a working
 * URL in the initial HTML and no request is wasted; anything that starts
 * refusing later is caught by the retry without a code change.
 */
export function ProductImage({ src, alt, onError, ...props }: ProductImageProps) {
  // Keyed by src so switching gallery slides re-tries from the top rather
  // than inheriting the previous image's failures.
  const [failure, setFailure] = useState<{ src: string; stage: Stage } | null>(null);

  const initialStage: Stage = isOptimizerBlockedHost(src) ? "direct" : "optimized";
  const stage: Stage = !src
    ? "placeholder"
    : failure?.src === src
      ? failure.stage
      : initialStage;

  const isPlaceholder = stage === "placeholder";

  return (
    <Image
      {...props}
      src={isPlaceholder ? FALLBACK_IMAGE : (src as string)}
      alt={alt}
      unoptimized={stage === "direct"}
      onError={(event) => {
        if (!src || isPlaceholder) return;
        onError?.(event);
        // One step down per failure. `direct` is skipped when we already
        // started there, so a dead URL still reaches the placeholder.
        setFailure({ src, stage: stage === "optimized" ? "direct" : "placeholder" });
      }}
    />
  );
}
