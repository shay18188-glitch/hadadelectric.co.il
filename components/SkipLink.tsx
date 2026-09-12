"use client";

import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n/locales";
import { CHROME } from "@/lib/i18n/chrome";

/**
 * The skip link has to be the first focusable element in the document, which
 * puts it in the root layout — a server component with no access to the
 * request path. It was therefore hard-coded Hebrew on every URL, including the
 * 1,600 translated ones. This thin client wrapper reads the locale from the
 * path so the first thing a screen reader announces is in the page's language.
 */
export function SkipLink() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname ?? "/");
  return (
    <a href="#main-content" className="skip-link">
      {CHROME[locale].skipToContent}
    </a>
  );
}
