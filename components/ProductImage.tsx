"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK_IMAGE = "/images/product-placeholder.svg";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
};

export function ProductImage({ src, alt, onError, ...props }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = !src || failedSrc === src ? FALLBACK_IMAGE : src;

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={(event) => {
        onError?.(event);
        if (src && resolvedSrc !== FALLBACK_IMAGE) setFailedSrc(src);
      }}
    />
  );
}
