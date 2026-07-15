import Link from "next/link";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { ContactForm } from "@/components/ContactForm";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { GoogleRating } from "@/components/GoogleRating";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { faqJsonLd, localBusinessJsonLd } from "@/lib/schema/jsonld";
import { BUSINESS } from "@/lib/utils";
import { CHROME } from "@/lib/i18n/chrome";
import { LOCALE_HTML_LANG, type Locale } from "@/lib/i18n/locales";
import type { LocalePageContent } from "@/content/i18n/types";

/**
 * Server-rendered page templates shared by the /en and /ru sections. The
 * document direction is flipped to LTR by the locale bootstrap script in the
 * root layout; the lang attribute here covers the SSR HTML for crawlers.
 */

interface LocaleProps {
  locale: Locale;
  content: LocalePageContent;
}

function LocaleMain({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div lang={LOCALE_HTML_LANG[locale]} dir="ltr">
      {children}
    </div>
  );
}

function CtaRow({ locale, content, large = false }: LocaleProps & { large?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <WhatsAppButton
        message={buildWhatsAppGeneralMessage(locale)}
        label={content.home.ctaWhatsApp}
        trackAs="whatsapp_click_header"
        size={large ? "lg" : "md"}
      />
      <PhoneButton phone={BUSINESS.phoneDisplay} label={content.home.ctaPhone} size={large ? "lg" : "md"} />
    </div>
  );
}

export function LocaleHomePage({ locale, content }: LocaleProps) {
  const c = content.home;
  const areas = CHROME[locale].footer.areasLinks;
  const faqItems = content.faq.categories.flatMap((cat) => cat.items).slice(0, 4);

  return (
    <LocaleMain locale={locale}>
      <JsonLd data={[localBusinessJsonLd(), faqJsonLd(faqItems)]} />

      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-blue-light/60 to-white">
        <div className="container-page py-12 md:py-20">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-graphite md:text-5xl">{c.heroTitle}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-graphite-soft/90 md:text-lg">{c.heroSubtitle}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <WhatsAppButton
              message={buildWhatsAppGeneralMessage(locale)}
              label={c.ctaWhatsApp}
              trackAs="whatsapp_click_header"
              size="lg"
            />
            <PhoneButton phone={BUSINESS.phoneDisplay} label={c.ctaPhone} size="lg" />
            <Link
              href={locale === "ru" ? "/ru/products" : "/en/products"}
              className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3.5 text-base font-semibold text-graphite hover:bg-surface"
            >
              {c.ctaCatalog}
            </Link>
          </div>
          <div className="mt-8 max-w-md">
            <GoogleRating variant="inline" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-10 md:py-16" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-xl font-bold text-graphite md:text-3xl">
          {c.categoriesTitle}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-graphite-soft/90 md:text-base">{c.categoriesIntro}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {c.categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-surface py-10 md:py-16" aria-labelledby="why-heading">
        <div className="container-page">
          <h2 id="why-heading" className="mb-5 text-xl font-bold text-graphite md:mb-8 md:text-3xl">
            {c.whyTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {c.why.map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-white p-5 md:p-6">
                <h3 className="text-[15px] font-bold text-graphite md:text-base">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite-soft/80 md:mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO text + areas */}
      <section className="container-page py-10 md:py-16" aria-labelledby="local-heading">
        <h2 id="local-heading" className="text-xl font-bold text-graphite md:text-3xl">
          {c.seoTitle}
        </h2>
        <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-graphite-soft/90 md:mt-4 md:text-base">
          {c.seoParagraphs.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
        <h3 className="mt-8 text-lg font-bold text-graphite">{c.areasTitle}</h3>
        <p className="mt-2 text-sm text-graphite-soft/90 md:text-base">{c.areasIntro}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {areas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
            >
              {area.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Notice */}
      <section className="container-page pb-4 md:pb-6">
        <div className="rounded-2xl border border-line bg-brand-blue-light px-5 py-5 text-center text-sm text-graphite md:px-6 md:py-6 md:text-base">
          {c.notice}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-10 md:py-16" aria-labelledby="faq-heading">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
          <h2 id="faq-heading" className="text-xl font-bold text-graphite md:text-3xl">
            {c.faqTitle}
          </h2>
          <Link
            href={locale === "ru" ? "/ru/faq" : "/en/faq"}
            className="hidden text-sm font-semibold text-brand-blue hover:underline md:block"
          >
            {c.faqMore}
          </Link>
        </div>
        <FaqAccordion items={faqItems} />
      </section>

      {/* Contact strip */}
      <section className="container-page pb-12 md:pb-16">
        <div className="rounded-2xl border border-line bg-surface p-6 text-center md:p-10">
          <h2 className="text-xl font-bold text-graphite md:text-2xl">{c.contactTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-graphite-soft/80 md:text-base">{c.contactSubtitle}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <CtaRow locale={locale} content={content} />
          </div>
        </div>
      </section>
    </LocaleMain>
  );
}

export function LocaleAboutPage({ locale, content }: LocaleProps) {
  const c = content.about;
  return (
    <LocaleMain locale={locale}>
      <div className="container-page py-10 md:py-14">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">{c.title}</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:text-base">{c.intro}</p>
        {c.sections.map((section) => (
          <section key={section.title} className="mt-8 max-w-3xl">
            <h2 className="text-lg font-bold text-graphite md:text-2xl">{section.title}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-graphite-soft/90 md:text-base">
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        <div className="mt-10">
          <CtaRow locale={locale} content={content} />
        </div>
      </div>
    </LocaleMain>
  );
}

export function LocaleContactPage({ locale, content }: LocaleProps) {
  const c = content.contact;
  return (
    <LocaleMain locale={locale}>
      <div className="container-page py-10 pb-12 md:py-14 md:pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">{c.title}</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:mt-4 md:text-base">{c.intro}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-10 md:mt-10">
          <div className="space-y-5 md:space-y-6">
            <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
              <h2 className="text-lg font-bold text-graphite">{c.detailsTitle}</h2>
              <address className="mt-3 space-y-2 text-sm not-italic text-graphite-soft/80">
                <p className="font-medium text-graphite">{BUSINESS.nameEn}</p>
                <p>{c.addressLine}</p>
                <p>
                  {c.phoneLabel}:{" "}
                  <a href={BUSINESS.phoneHref} className="text-brand-blue hover:underline" dir="ltr">
                    {BUSINESS.phoneDisplay}
                  </a>
                </p>
                <p>
                  {c.whatsappLabel}:{" "}
                  <a href="tel:0522692235" className="text-brand-blue hover:underline" dir="ltr">
                    {BUSINESS.mobileDisplay}
                  </a>
                </p>
              </address>
              <div className="mt-5">
                <CtaRow locale={locale} content={content} />
              </div>
              <div className="mt-5">
                <GoogleRating />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
              <h2 className="text-lg font-bold text-graphite">{c.hoursTitle}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-graphite-soft/80">
                {c.hours.map((entry) => (
                  <li key={entry.day} className="flex justify-between gap-4">
                    <span>{entry.day}</span>
                    <span>{entry.hours}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-graphite-soft/50">{c.hoursNote}</p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 md:p-6">
              <h2 className="text-lg font-bold text-graphite">{c.usefulTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {c.usefulLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-brand-blue hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe
                title={c.mapTitle}
                src="https://www.google.com/maps?q=%D7%9C%D7%95%D7%97%D7%9E%D7%99+%D7%94%D7%92%D7%98%D7%90%D7%95%D7%AA+3+%D7%A0%D7%94%D7%A8%D7%99%D7%94&output=embed"
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 md:p-6 lg:sticky lg:top-24 lg:h-fit">
            <h2 className="text-lg font-bold text-graphite">{c.formTitle}</h2>
            <p className="mt-1 text-sm text-graphite-soft/70">{c.formIntro}</p>
            <div className="mt-5">
              <ContactForm locale={locale} />
            </div>
            <p className="mt-4 text-xs text-graphite-soft/60">
              {c.privacyNote}{" "}
              <Link href="/privacy-policy" className="text-brand-blue hover:underline">
                {c.privacyLinkLabel}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </LocaleMain>
  );
}

export function LocaleDeliveryPage({ locale, content }: LocaleProps) {
  const c = content.delivery;
  return (
    <LocaleMain locale={locale}>
      <div className="container-page py-10 md:py-14">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">{c.title}</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:text-base">{c.intro}</p>
        {c.sections.map((section) => (
          <section key={section.title} className="mt-8 max-w-3xl">
            <h2 className="text-lg font-bold text-graphite md:text-2xl">{section.title}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-graphite-soft/90 md:text-base">
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        <section className="mt-8 max-w-3xl">
          <h2 className="text-lg font-bold text-graphite md:text-2xl">{c.areasTitle}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft/90 md:text-base">{c.areasIntro}</p>
        </section>
        <div className="mt-10 rounded-2xl border border-line bg-surface p-6 md:p-8">
          <h2 className="text-lg font-bold text-graphite md:text-xl">{c.ctaTitle}</h2>
          <p className="mt-1 text-sm text-graphite-soft/80 md:text-base">{c.ctaSubtitle}</p>
          <div className="mt-4">
            <CtaRow locale={locale} content={content} />
          </div>
        </div>
      </div>
    </LocaleMain>
  );
}

export function LocaleFaqPage({ locale, content }: LocaleProps) {
  const c = content.faq;
  const allItems = c.categories.flatMap((cat) => cat.items);
  return (
    <LocaleMain locale={locale}>
      <JsonLd data={faqJsonLd(allItems)} />
      <div className="container-page py-10 md:py-14">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">{c.title}</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/90 md:text-base">{c.intro}</p>
        {c.categories.map((category) => (
          <section key={category.title} className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-graphite md:text-2xl">{category.title}</h2>
            <FaqAccordion items={category.items} />
          </section>
        ))}
        <div className="mt-10 rounded-2xl border border-line bg-surface p-6 md:p-8">
          <h2 className="text-lg font-bold text-graphite md:text-xl">{c.ctaTitle}</h2>
          <p className="mt-1 text-sm text-graphite-soft/80 md:text-base">{c.ctaSubtitle}</p>
          <div className="mt-4">
            <CtaRow locale={locale} content={content} />
          </div>
        </div>
      </div>
    </LocaleMain>
  );
}
