import { cleanModelNumber } from "@/lib/normalize";
import { BUSINESS, EXPERT } from "@/lib/utils";

type NoteLocale = "he" | "en" | "ru";

const TEXT: Record<NoteLocale, {
  kicker: string;
  heading: (model: string) => string;
  name: string;
  role: string;
  /** Says where the opinion comes from — the claim behind the byline. */
  provenance: string;
}> = {
  he: {
    kicker: "חוות דעת מהחנות",
    heading: (model) => `הערת מומחה על ${model}`,
    name: EXPERT.nameHe,
    role: `${EXPERT.roleHe}, ${BUSINESS.nameHe}`,
    provenance: `נכתב על ידי ${EXPERT.nameHe} בחנות בנהריה, על סמך התקנות ושירות בפועל אצל לקוחות בצפון.`,
  },
  en: {
    kicker: "From the shop floor",
    heading: (model) => `Expert note on ${model}`,
    name: EXPERT.nameEn,
    role: `${EXPERT.roleEn}, ${BUSINESS.nameEn}`,
    provenance: `Written by ${EXPERT.nameEn} at the Nahariya shop, from installing and servicing these units for customers across northern Israel.`,
  },
  ru: {
    kicker: "Мнение магазина",
    heading: (model) => `Заметка специалиста о ${model}`,
    name: EXPERT.nameEn,
    role: `${EXPERT.roleRu}, ${BUSINESS.nameEn}`,
    provenance: `Написано Ювалем Хададом в магазине в Нагарии, на основе реальных установок и обслуживания на севере Израиля.`,
  },
};

/**
 * Yuval's note on a product.
 *
 * Worth being deliberate about why this looks the way it does. Every other
 * word on a product page arrives from the supplier feed, which means the same
 * words sit on every competitor's page for the same model — there is nothing
 * in them for a search engine to prefer this page for. The note is the only
 * original text the page has, so it is treated as primary content rather than
 * a footnote: its own section, an `h2` carrying the model number people
 * actually search, real prose in `<p>`, and a named human attached to it.
 *
 * The byline is not decoration either. An opinion about an appliance is worth
 * what its author is worth, and both search engines and readers are now asking
 * who that is. Saying it in visible text — name, role, and where the
 * experience comes from — is the honest answer, and the structured data on
 * this page repeats exactly the same claim rather than a stronger one.
 *
 * Renders nothing when there is no note. It is never padded with generated
 * filler: an empty section here is more useful than a fake one, because the
 * value of the block is precisely that it is not automated.
 */
export function ExpertNote({
  note,
  modelNumber,
  locale = "he",
}: {
  note: string | null;
  modelNumber: string;
  locale?: NoteLocale;
}) {
  if (!note) return null;

  const t = TEXT[locale];
  // Authors write paragraphs; a run of blank lines is not a paragraph break
  // worth preserving, so consecutive newlines collapse into one split.
  const paragraphs = note
    .split(/\n{1,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  // The note is Hebrew prose from the shop; the locale pages have no
  // translation for it yet, so they mark the direction rather than render
  // Hebrew inside an LTR flow. Same rule the spec table already follows.
  const bodyDirection = locale === "he" ? undefined : ({ lang: "he", dir: "rtl" } as const);

  return (
    <section
      className="surface-card relative mt-10 overflow-hidden rounded-[1.75rem] p-6 md:mt-12 md:p-9"
      aria-labelledby="expert-note-heading"
    >
      {/* Gold rule down the reading edge — the same accent the section
          kickers use, turned into the block's own margin marker. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-brand-gold via-brand-gold/70 to-transparent"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="section-kicker">{t.kicker}</p>
        <span className="rounded-full bg-brand-blue-light px-3 py-1 text-[11px] font-bold text-brand-blue">
          {cleanModelNumber(modelNumber)}
        </span>
      </div>

      <h2
        id="expert-note-heading"
        className="heading-balance mt-2 text-2xl font-black tracking-[-0.03em] text-graphite md:text-3xl"
      >
        {t.heading(cleanModelNumber(modelNumber))}
      </h2>

      <div
        {...bodyDirection}
        className="mt-4 space-y-3 text-[15px] leading-[1.75] text-graphite-soft/90 md:text-base"
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <footer className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-blue text-base font-black text-white"
        >
          {/* Initials rather than a stock photo: a made-up portrait would
              undercut the one part of this page that is actually verified. */}
          {EXPERT.initialsHe}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-graphite">{t.name}</p>
          <p className="text-xs text-graphite-soft/70">{t.role}</p>
        </div>
      </footer>

      <p className="mt-3 text-xs leading-relaxed text-graphite-soft/55">{t.provenance}</p>
    </section>
  );
}
