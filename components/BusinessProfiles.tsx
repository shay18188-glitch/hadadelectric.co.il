import { BUSINESS_PROFILES } from "@/content/reviews";
import { CHROME } from "@/lib/i18n/chrome";
import type { Locale } from "@/lib/i18n/locales";
import { cx } from "@/lib/utils";

/**
 * Row of external business-listing links (citations): Google, Facebook,
 * דפי זהב, B144, easy. Reinforces trust and gives customers more ways to
 * reach the store.
 */
export function BusinessProfiles({
  title,
  className,
  locale = "he",
}: {
  title?: string;
  className?: string;
  locale?: Locale;
}) {
  const heading = title ?? CHROME[locale].reviews.findUsAt;
  return (
    <div className={cx("flex flex-wrap items-center gap-x-2 gap-y-2", className)}>
      <span className="text-sm font-semibold text-graphite">{heading}</span>
      <ul className="flex flex-wrap items-center gap-2">
        {BUSINESS_PROFILES.map((profile) => (
          <li key={profile.name}>
            <a
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-graphite transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
            >
              {profile.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
