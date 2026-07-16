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
    <footer className="mt-20 border-t border-white/10 bg-[#061522] text-white">
      <div className="h-1 bg-gradient-to-l from-brand-blue via-brand-gold to-brand-blue" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-5 md:py-16">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-brand-gold/40">
              <Image src="/brand/logo.png" alt={BUSINESS.nameHe} fill sizes="48px" className="object-contain p-1" />
            </span>
            <div>
              <p className="font-bold text-white">{locale === "he" ? BUSINESS.nameHe : BUSINESS.nameEn}</p>
              <p className="text-xs text-white/45">{locale === "he" ? BUSINESS.nameEn : BUSINESS.nameHe}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{dict.tagline}</p>
          <address className="mt-4 space-y-1.5 text-sm not-italic text-white/60">
            <p>
              {BUSINESS.addressStreet}, {BUSINESS.addressCity}
            </p>
            <p>
              <a href={telHref(BUSINESS.phoneDisplay)} className="hover:text-brand-gold">
                {BUSINESS.phoneDisplay}
              </a>
              {" · "}
              <a href={telHref(BUSINESS.mobileDisplay)} className="hover:text-brand-gold">
                {BUSINESS.mobileDisplay}
              </a>
            </p>
            <p>
              <a
                href={BUSINESS.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-gold"
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

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/40 md:flex-row">
          <p>
            © {new Date().getFullYear()} {locale === "he" ? BUSINESS.nameHe : BUSINESS.nameEn}. {dict.rights}
          </p>
          <ul className="flex flex-wrap gap-4">
            {dict.legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand-gold">
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
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/55 transition-colors hover:text-brand-gold">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
