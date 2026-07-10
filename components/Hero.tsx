import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue-light/70 via-white to-white">
      <div className="container-page grid gap-8 py-10 md:grid-cols-2 md:items-center md:gap-10 md:py-24">
        <div>
          <p className="mb-2.5 inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-blue ring-1 ring-brand-blue/20 md:mb-3 md:text-xs">
            {BUSINESS.nameHe}
          </p>
          <h1 className="text-[1.65rem] font-extrabold leading-tight text-graphite md:text-5xl">
            חנות מוצרי חשמל בנהריה — שירות אישי לכל הצפון
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-graphite-soft/90 md:mt-4 md:text-lg">
            קטלוג נוח, בדיקת זמינות מהירה והזמנה ישירה בוואטסאפ או בטלפון — עם משלוח והתקנה עד בית הלקוח בכל
            אזור הצפון.
          </p>

          <div className="mt-5 max-w-lg md:mt-7">
            <SearchBar size="lg" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5 md:mt-6 md:gap-3">
            <Link
              href="/products"
              className="tap-target inline-flex items-center justify-center rounded-full bg-graphite px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-graphite-soft md:px-6 md:py-3"
            >
              צפו בקטלוג
            </Link>
            <WhatsAppButton message={buildWhatsAppGeneralMessage()} trackAs="whatsapp_click_header" size="sm" />
            <PhoneButton phone={BUSINESS.phoneDisplay} size="sm" className="hidden min-[380px]:inline-flex" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-brand-blue/15 blur-3xl md:-inset-6 md:rounded-[3rem]"
            aria-hidden="true"
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-white shadow-xl ring-1 ring-line md:aspect-square md:rounded-[2.5rem]">
            <Image
              src="/images/hero-appliances.png"
              alt="מוצרי חשמל לבית — מקרר, מכונת כביסה, תנור, מזגן וטלוויזיה"
              fill
              sizes="(max-width: 768px) 90vw, 448px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
