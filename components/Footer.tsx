"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GoogleRating } from "@/components/GoogleRating";
import { BusinessProfiles } from "@/components/BusinessProfiles";
import { getLocaleFromPathname } from "@/lib/i18n/locales";
import { CHROME } from "@/lib/i18n/chrome";
import { BUSINESS } from "@/lib/utils";
import { telHref } from "@/lib/whatsapp/messages";

// Client component so the chrome follows the current locale (/en, /ru) via
// the pathname; it renders static links and text only.
export function Footer() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const dict = CHROME[locale].footer;

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-line">
              <Image src="/brand/logo.png" alt={BUSINESS.nameHe} fill sizes="48px" className="object-contain p-1" />
            </span>
            <div>
              <p className="font-bold text-graphite">{locale === "he" ? BUSINESS.nameHe : BUSINESS.nameEn}</p>
              <p className="text-xs text-graphite-soft/70">{locale === "he" ? BUSINESS.nameEn : BUSINESS.nameHe}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-graphite-soft/80">{dict.tagline}</p>
          <address className="mt-4 space-y-1 text-sm not-italic text-graphite-soft/80">
            <p>
              {BUSINESS.addressStreet}, {BUSINESS.addressCity}
            </p>
            <p>
              <a href={telHref(BUSINESS.phoneDisplay)} className="hover:text-brand-blue">
                {BUSINESS.phoneDisplay}
              </a>
              {" · "}
              <a href={telHref(BUSINESS.mobileDisplay)} className="hover:text-brand-blue">
                {BUSINESS.mobileDisplay}
              </a>
            </p>
            <p>
              <a
                href={BUSINESS.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-blue"
              >
                {dict.facebook}
              </a>
            </p>
          </address>

          <div className="mt-5">
            <GoogleRating variant="inline" />
          </div>
          <div className="mt-4">
            <BusinessProfiles />
          </div>
        </div>

        <FooterColumn title={dict.catalogTitle} links={dict.catalogLinks} />
        <FooterColumn title={dict.companyTitle} links={dict.companyLinks} />
        <FooterColumn title={dict.areasTitle} links={dict.areasLinks} />
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-graphite-soft/60 md:flex-row">
          <p>
            © {new Date().getFullYear()} {locale === "he" ? BUSINESS.nameHe : BUSINESS.nameEn}. {dict.rights}
          </p>
          <ul className="flex flex-wrap gap-4">
            {dict.legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand-blue">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-graphite">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-graphite-soft/80 hover:text-brand-blue">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
