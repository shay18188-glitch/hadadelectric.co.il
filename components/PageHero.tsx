import type { ReactNode } from "react";
import Image from "next/image";
import { cx } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: ReactNode;
  imageSrc: string;
  imageAlt: string;
  badges?: ReactNode;
  imageClassName?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  badges,
  imageClassName,
}: PageHeroProps) {
  return (
    <section
      className="relative isolate flex min-h-[25rem] items-end overflow-hidden rounded-[2rem] bg-[#071a2c] text-white shadow-[0_38px_95px_-50px_rgba(7,26,44,.9)] md:min-h-[31rem] md:items-center md:rounded-[2.75rem]"
      aria-labelledby="page-hero-title"
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        loading="eager"
        sizes="(max-width: 768px) 100vw, 94vw"
        className={cx("-z-30 object-cover", imageClassName)}
      />
      <div className="absolute inset-0 -z-20 bg-gradient-to-t from-[#061625]/98 via-[#061625]/72 to-[#061625]/18 md:bg-gradient-to-l md:from-[#061625]/98 md:via-[#061625]/82 md:to-[#061625]/18" />
      <div className="blueprint-grid absolute inset-0 -z-10 opacity-35" aria-hidden="true" />
      <div className="absolute -start-20 -top-20 -z-10 h-72 w-72 rounded-full border border-brand-gold/15" aria-hidden="true" />

      <div className="w-full px-6 pb-8 pt-36 sm:px-9 sm:pb-10 md:max-w-[69%] md:px-12 md:py-14 lg:px-16">
        <p className="section-kicker !text-[.82rem] !font-black !text-brand-gold md:!text-sm">{eyebrow}</p>
        <h1
          id="page-hero-title"
          className="heading-balance mt-4 text-[2.75rem] font-black leading-[.98] tracking-[-.052em] text-white sm:text-6xl md:text-[4.5rem] lg:text-[5.25rem]"
        >
          {title}
        </h1>
        <div className="mt-5 max-w-3xl text-base leading-8 text-white/82 sm:text-lg md:text-xl md:leading-9">
          {description}
        </div>
        {badges && <div className="mt-7 flex flex-wrap gap-2.5 text-sm font-bold text-white/86">{badges}</div>}
      </div>
    </section>
  );
}
