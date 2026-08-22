import Image from "next/image";
import Link from "next/link";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { GoogleRating } from "@/components/GoogleRating";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppGeneralMessage } from "@/lib/whatsapp/messages";
import { BUSINESS } from "@/lib/utils";

const TRUST_ITEMS = [
  { title: "משלוחים בכל הצפון", note: "מתואם עד הבית", icon: "truck" },
  { title: "התקנה מקצועית", note: "צוותים מנוסים", icon: "tools" },
  { title: "יבואנים רשמיים", note: "אחריות ושקט", icon: "badge" },
  { title: "חנות פיזית בנהריה", note: "ייעוץ פנים אל פנים", icon: "store" },
] as const;

export function Hero() {
  return (
    <section className="overflow-hidden pb-2 pt-1 md:pb-6 md:pt-5">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-[1.75rem] border border-line/70 bg-white shadow-[0_30px_80px_-55px_rgba(10,22,36,0.5)] md:min-h-[38rem] md:grid-cols-[0.9fr_1.1fr] md:rounded-[2.75rem] md:shadow-[0_36px_100px_-58px_rgba(10,22,36,0.58)]">
          <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-9 sm:py-10 md:px-10 md:py-14 lg:px-12 xl:px-14">
            <p className="section-kicker">חדד יובל אלקטריק · נהריה</p>
            <h1 className="mt-3.5 text-[2.25rem] font-extrabold leading-[1.02] tracking-[-0.055em] text-graphite min-[390px]:text-[2.4rem] sm:mt-5 sm:text-5xl md:text-[3.35rem] lg:text-[3.75rem] xl:text-[4rem]">
              <span className="block">מוצרי חשמל בנהריה</span>{" "}
              <span className="mt-2 block text-[0.64em] leading-[1.15] tracking-[-0.035em] text-brand-blue">
                קונים רק עם חדד אלקטריק
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6.5 text-graphite-soft/78 sm:mt-5 sm:text-base sm:leading-7 md:text-lg md:leading-8">
              מותגים מובילים, התאמה מקצועית ושירות שמגיע עד הבית — בנהריה ובכל אזור הצפון.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:mt-7 sm:flex sm:flex-wrap sm:gap-3 md:mt-9">
              <Link
                href="/products"
                className="tap-target inline-flex w-full items-center justify-center rounded-full bg-brand-blue px-3 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-16px_rgba(11,87,147,0.8)] transition-all hover:-translate-y-0.5 hover:bg-brand-blue-dark sm:w-auto sm:px-6 md:px-7 md:py-3.5 md:text-base"
              >
                לצפייה במוצרים
                <span aria-hidden="true" className="me-2">←</span>
              </Link>
              <WhatsAppButton
                message={buildWhatsAppGeneralMessage()}
                label="ייעוץ בוואטסאפ"
                mobileLabel="וואטסאפ"
                variant="outline"
                size="lg"
                trackAs="whatsapp_click_header"
                className="w-full !border-graphite/15 !bg-white !px-3 !py-3 !text-sm hover:!border-brand-blue/35 hover:!text-brand-blue sm:w-auto sm:!px-6 sm:!py-3.5 sm:!text-base"
              />
              <PhoneButton
                phone={BUSINESS.phoneDisplay}
                label="שיחה עם יועץ"
                size="lg"
                className="hidden !px-5 lg:inline-flex"
              />
            </div>

            <div className="mt-5 sm:mt-7">
              <GoogleRating variant="inline" className="!border-transparent !bg-surface/70 !shadow-none" />
            </div>
          </div>

          <div className="relative min-h-[16rem] overflow-hidden min-[390px]:min-h-[18rem] sm:min-h-[31rem] md:min-h-full">
            <Image
              src="/images/redesign/home-hero.png"
              alt="מטבח וסלון מודרניים עם מקרר, תנור וטלוויזיה"
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
              loading="eager"
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
