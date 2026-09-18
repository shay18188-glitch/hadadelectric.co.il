"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProductImage } from "@/components/ProductImage";
import { cx } from "@/lib/utils";

type GalleryLocale = "he" | "en" | "ru";

const TEXT: Record<GalleryLocale, {
  counter: (current: number, total: number) => string;
  thumb: (index: number, total: number) => string;
  prev: string;
  next: string;
  open: string;
  close: string;
  region: string;
}> = {
  he: {
    counter: (c, t) => `${c} מתוך ${t}`,
    thumb: (i, t) => `הצג תמונה ${i} מתוך ${t}`,
    prev: "התמונה הקודמת",
    next: "התמונה הבאה",
    open: "הגדלת התמונה למסך מלא",
    close: "סגירת התצוגה המוגדלת",
    region: "גלריית תמונות המוצר",
  },
  en: {
    counter: (c, t) => `${c} of ${t}`,
    thumb: (i, t) => `Show image ${i} of ${t}`,
    prev: "Previous image",
    next: "Next image",
    open: "Open image full screen",
    close: "Close full screen view",
    region: "Product image gallery",
  },
  ru: {
    counter: (c, t) => `${c} из ${t}`,
    thumb: (i, t) => `Показать изображение ${i} из ${t}`,
    prev: "Предыдущее изображение",
    next: "Следующее изображение",
    open: "Открыть изображение на весь экран",
    close: "Закрыть полноэкранный просмотр",
    region: "Галерея изображений товара",
  },
};

interface ProductGalleryProps {
  images: string[];
  alt: string;
  locale?: GalleryLocale;
  /** Extra classes for the main image frame, so each page keeps its own shell. */
  frameClassName?: string;
  /** Padding applied to the image itself (the pages differ here). */
  imageClassName?: string;
  /**
   * Classes for the thumbnail strip. The product page bleeds its frame to
   * the card edge, so the strip needs the inset the frame does not have.
   */
  thumbsClassName?: string;
  sizes?: string;
}

/**
 * The product image viewer.
 *
 * Single-image products — 946 of the 948 in the feed today — render exactly
 * the frame they always have, with no strip, no counter and no extra DOM. The
 * gallery only materializes on the second image, so the common page does not
 * pay for a feature it cannot use.
 *
 * Paging is a CSS scroll-snap track rather than a JS slider. Swipe, momentum,
 * and the trackpad all come from the platform, it works before hydration, and
 * a dropped JS bundle degrades to a scrollable row of images instead of a
 * dead control — which matters because most of this traffic is phones.
 */
export function ProductGallery({
  images,
  alt,
  locale = "he",
  frameClassName,
  imageClassName,
  thumbsClassName,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: ProductGalleryProps) {
  const t = TEXT[locale];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const galleryId = useId();

  const total = images.length;
  const hasGallery = total > 1;


  /**
   * Which slide the track has settled on.
   *
   * Read from scrollLeft rather than an IntersectionObserver because the
   * track is also scrolled programmatically, and `Math.abs` keeps the maths
   * identical under RTL, where scrollLeft counts negative in every engine
   * that follows the spec.
   */
  const syncActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.clientWidth;
    if (slide === 0) return;
    const index = Math.round(Math.abs(track.scrollLeft) / slide);
    setActive((current) => (current === index ? current : Math.min(index, total - 1)));
  }, [total]);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    const clamped = Math.max(0, Math.min(index, total - 1));
    setActive(clamped);
    if (!track) return;
    // Ask the layout which way it runs. Inferring it from the sign of
    // scrollLeft cannot work: at the first slide the offset is 0 in both
    // directions, so an RTL track read as LTR and every "next" scrolled to a
    // positive offset the engine clamps straight back to 0 — the counter
    // advanced while the image sat still.
    const rtl = getComputedStyle(track).direction === "rtl";
    track.scrollTo({ left: (rtl ? -1 : 1) * clamped * track.clientWidth, behavior: "smooth" });
  }, [total]);

  // Escape closes the zoom view; arrows page through it. The inline strip
  // gets arrow keys from the thumbnails themselves, which are real buttons.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowRight") setActive((i) => (i + 1) % total);
      if (event.key === "ArrowLeft") setActive((i) => (i - 1 + total) % total);
    };
    document.addEventListener("keydown", onKey);
    // The page behind a full-screen viewer must not scroll with it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed, total]);

  const frame = cx(
    "relative aspect-square overflow-hidden bg-[linear-gradient(145deg,#f6f4ef,#ebe8e1)]",
    frameClassName
  );

  if (!hasGallery) {
    return (
      <div className={frame}>
        <ProductImage
          src={images[0] || "/images/product-placeholder-v2.webp"}
          alt={alt}
          fill
          sizes={sizes}
          className={cx("object-contain", images[0] ? imageClassName : "p-0 opacity-95")}
          priority
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col" role="group" aria-roledescription="carousel" aria-label={t.region}>
      <div className={frame}>
        <div
          ref={trackRef}
          onScroll={syncActive}
          className="scroll-x-fade flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          tabIndex={0}
          aria-label={t.region}
        >
          {images.map((src, index) => (
            <div key={`${index}-${src}`} className="relative h-full w-full shrink-0 snap-center">
              <ProductImage
                src={src}
                alt={index === 0 ? alt : `${alt} — ${t.counter(index + 1, total)}`}
                fill
                sizes={sizes}
                className={cx("object-contain", imageClassName)}
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* A corner control, deliberately not an invisible sheet over the
            image. Overlaying the middle made a tidy tap target and broke the
            gesture that matters more: the overlay is a sibling of the scroll
            track, not a child, so a swipe beginning anywhere near the centre
            found no scrollable ancestor and the gallery simply did not move
            under a thumb. The track now owns every pixel of the image. */}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={t.open}
          className="absolute bottom-3 start-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-graphite shadow-[0_8px_24px_-14px_rgba(10,22,36,0.7)] backdrop-blur-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        <span
          className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-graphite/72 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm"
          aria-hidden="true"
        >
          {active + 1}/{total}
        </span>

        {/* Pointer-driven paging. Hidden on phones, where the swipe is the
            gesture people already reach for and arrows only cover product. */}
        <GalleryArrow
          direction="prev"
          label={t.prev}
          disabled={active === 0}
          onClick={() => goTo(active - 1)}
        />
        <GalleryArrow
          direction="next"
          label={t.next}
          disabled={active === total - 1}
          onClick={() => goTo(active + 1)}
        />

        {/* The live region announces the change; the counter chip above is
            decorative so the two do not read out twice. */}
        <p className="sr-only" aria-live="polite">
          {t.counter(active + 1, total)}
        </p>
      </div>

      <div
        className={cx("scroll-x-fade mt-3 flex gap-2 overflow-x-auto pb-1", thumbsClassName)}
        role="group"
        aria-label={t.region}
      >
        {images.map((src, index) => (
          <button
            key={`${index}-${src}`}
            type="button"
            id={`${galleryId}-thumb-${index}`}
            onClick={() => goTo(index)}
            onKeyDown={(event) => {
              // Arrow keys walk the strip and move focus with the selection,
              // so a keyboard user is never selecting a thumbnail they have
              // scrolled away from.
              const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              if (step === 0) return;
              event.preventDefault();
              const next = (index + step + total) % total;
              goTo(next);
              document.getElementById(`${galleryId}-thumb-${next}`)?.focus();
            }}
            aria-label={t.thumb(index + 1, total)}
            aria-current={index === active}
            className={cx(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white transition md:h-[4.5rem] md:w-[4.5rem]",
              index === active
                ? "border-brand-blue ring-2 ring-brand-blue/25"
                : "border-line opacity-70 hover:opacity-100"
            )}
          >
            <ProductImage src={src} alt="" fill sizes="72px" className="object-contain p-1.5" />
          </button>
        ))}
      </div>

      {/* Portalled to <body>, and only ever reached from a click — so the
          document exists by then and no mount flag is needed. Left in place
          it renders inside the product card, whose ancestors establish
          their own stacking contexts — the
          z-index is then compared against that card's siblings rather than
          the page, and the floating accessibility button (z-60) drew on top
          of a z-70 overlay. Escaping to the root makes the layering mean
          what it says. */}
      {zoomed && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-graphite/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t.region}
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-semibold tabular-nums">{t.counter(active + 1, total)}</span>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              autoFocus
              aria-label={t.close}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-xl leading-none transition hover:bg-white/20"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="relative flex-1">
            <ProductImage
              src={images[active]}
              alt={`${alt} — ${t.counter(active + 1, total)}`}
              fill
              sizes="100vw"
              className="object-contain p-4"
            />
          </div>

          <div className="flex justify-center gap-2 p-4">
            {images.map((src, index) => (
              <button
                key={`${index}-${src}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={t.thumb(index + 1, total)}
                aria-current={index === active}
                className={cx(
                  "h-2.5 rounded-full transition-all",
                  index === active ? "w-7 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function GalleryArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cx(
        "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-graphite shadow-[0_8px_24px_-12px_rgba(10,22,36,0.6)] backdrop-blur-sm transition md:grid",
        "hover:bg-white disabled:pointer-events-none disabled:opacity-0",
        direction === "prev" ? "start-3" : "end-3"
      )}
    >
      {/* Chevrons point outward along the reading direction, which the
          logical `start`/`end` placement above already mirrors under RTL. */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {direction === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}
