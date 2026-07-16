import Image from "next/image";
import Link from "next/link";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { GoogleRating } from "@/components/GoogleRating";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";

const TRUST_ITEMS = [
  { title: "משלוחים בכל הצפון", note: "מתואם עד הבית", icon: "truck" },
  { title: "התקנה מקצועית", note: "צוותים מנוסים", icon: "tools" },
  { title: "יבואנים רשמיים", note: "אחריות ושקט", icon: "badge" },
  { title: "חנות פיזית בנהריה", note: "ייעוץ פנים אל פנים", icon: "store" },
] as const;

export function Hero() {
  return (
    <section className="overflow-hidden pb-3 pt-2 md:pb-6 md:pt-5">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-[2rem] border border-line/70 bg-white shadow-[0_36px_100px_-58px_rgba(10,22,36,0.58)] md:min-h-[38rem] md:grid-cols-[0.82fr_1.18fr] md:rounded-[2.75rem]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-9 md:px-10 md:py-14 lg:px-14 xl:px-16">
            <p className="section-kicker">חדד יובל אלקטריק · נהריה</p>
            <h1 className="heading-balance mt-5 text-[2.55rem] font-extrabold leading-[0.98] tracking-[-0.055em] text-graphite sm:text-5xl md:text-[3.55rem] lg:text-[4.35rem]">
              בית חכם מתחיל בבחירה נכונה
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-graphite-soft/78 sm:text-base md:text-lg md:leading-8">
              מוצרי חשמל מובילים, ייעוץ אישי ושירות שמגיע עד הבית — מנהריה ולכל אזור הצפון.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 md:mt-9">
              <Link
                href="/products"
                className="tap-target inline-flex items-center justify-center rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-16px_rgba(11,87,147,0.8)] transition-all hover:-translate-y-0.5 hover:bg-brand-blue-dark md:px-7 md:py-3.5 md:text-base"
              >
                לצפייה במוצרים
                <span aria-hidden="true" className="me-2">←</span>
              </Link>
              <WhatsAppButton
                message={buildWhatsAppGeneralMessage()}
                label="ייעוץ בוואטסאפ"
                variant="outline"
                size="lg"
                trackAs="whatsapp_click_header"
                className="!border-graphite/15 !bg-white hover:!border-brand-blue/35 hover:!text-brand-blue"
              />
            </div>

            <div className="mt-7">
              <GoogleRating variant="inline" className="!border-transparent !bg-surface/70 !shadow-none" />
            </div>
          </div>

          <div className="relative min-h-[23rem] overflow-hidden sm:min-h-[31rem] md:min-h-full">
            <Image
              src="/images/redesign/home-hero.png"
              alt="מטבח וסלון מודרניים עם מקרר, תנור וטלוויזיה"
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-white to-transparent md:block" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/18 to-transparent md:hidden" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-5 border-b border-line/70 px-1 py-6 sm:grid-cols-4 md:px-5 md:py-7">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex items-center gap-3 md:justify-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
                <TrustIcon name={item.icon} />
              </span>
              <span>
                <span className="block text-xs font-bold text-graphite sm:text-sm">{item.title}</span>
                <span className="mt-0.5 block text-[10px] text-graphite-soft/55 sm:text-xs">{item.note}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustIcon({ name }: { name: (typeof TRUST_ITEMS)[number]["icon"] }) {
  if (name === "truck") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]">
        <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.7" /><circle cx="18" cy="18" r="1.7" />
      </svg>
    );
  }
  if (name === "tools") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]">
        <path strokeLinecap="round" d="m4 20 7-7m2-2 7-7M15 4l5 5M4 4l5 5-2 2-5-5z" />
      </svg>
    );
  }
  if (name === "badge") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]">
        <circle cx="12" cy="12" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]">
      <path d="M4 10h16v10H4zM3 10l2-6h14l2 6M8 20v-6h4v6" />
    </svg>
  );
}
