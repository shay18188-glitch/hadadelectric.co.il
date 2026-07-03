import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue-light/70 via-white to-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="mb-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-blue ring-1 ring-brand-blue/20">
            {BUSINESS.nameHe}
          </p>
          <h1 className="text-3xl font-extrabold leading-tight text-graphite md:text-5xl">
            מוצרי חשמל בנהריה והצפון
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-graphite-soft/90 md:text-lg">
            קטלוג מוצרי חשמל לבית, בדיקת זמינות מהירה והזמנה ישירה בוואטסאפ או בטלפון — ללא מחירים וללא סליקה באתר.
          </p>

          <div className="mt-7 max-w-lg">
            <SearchBar size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-graphite-soft"
            >
              צפו בקטלוג
            </Link>
            <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" />
            <PhoneButton phone={BUSINESS.phoneDisplay} />
          </div>
        </div>

        <div className="relative mx-auto hidden aspect-square w-full max-w-md items-center justify-center rounded-[2.5rem] bg-white shadow-xl ring-1 ring-line md:flex">
          <div className="grid grid-cols-2 gap-4 p-8">
            {["מקררים", "מכונות כביסה", "תנורים", "מזגנים"].map((label) => (
              <div
                key={label}
                className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-2xl bg-surface text-graphite-soft"
              >
                <span className="text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
