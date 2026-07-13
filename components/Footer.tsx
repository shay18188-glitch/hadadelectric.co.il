import Link from "next/link";
import Image from "next/image";
import { GoogleRating } from "@/components/GoogleRating";
import { BusinessProfiles } from "@/components/BusinessProfiles";
import { BUSINESS } from "@/lib/utils";
import { telHref } from "@/lib/whatsapp/messages";

const CATALOG_LINKS = [
  { href: "/products", label: "כל המוצרים" },
  { href: "/categories", label: "קטגוריות" },
  { href: "/brands", label: "מותגים" },
  { href: "/guides", label: "מדריכים" },
  { href: "/request", label: "הבקשה שלי" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
  { href: "/faq", label: "שאלות נפוצות" },
  { href: "/services/delivery", label: "משלוחים והתקנה בצפון" },
];

const LOCAL_LINKS = [
  { href: "/electric-appliances-nahariya", label: "מוצרי חשמל בנהריה" },
  { href: "/electric-appliances-acre", label: "מוצרי חשמל בעכו" },
  { href: "/electric-appliances-krayot", label: "מוצרי חשמל בקריות" },
  { href: "/electric-appliances-haifa", label: "מוצרי חשמל בחיפה" },
  { href: "/electric-appliances-carmiel", label: "מוצרי חשמל בכרמיאל" },
  { href: "/electric-appliances-maalot", label: "מוצרי חשמל במעלות-תרשיחא" },
  { href: "/electric-appliances-nazareth", label: "מוצרי חשמל בנצרת" },
  { href: "/electric-appliances-safed", label: "מוצרי חשמל בצפת" },
  { href: "/electric-appliances-tiberias", label: "מוצרי חשמל בטבריה" },
  { href: "/electric-appliances-north", label: "כל אזורי השירות בצפון" },
];

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "מדיניות פרטיות" },
  { href: "/accessibility", label: "הצהרת נגישות" },
  { href: "/terms", label: "תנאי שימוש" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-line">
              <Image src="/brand/logo.png" alt={BUSINESS.nameHe} fill sizes="48px" className="object-contain p-1" />
            </span>
            <div>
              <p className="font-bold text-graphite">{BUSINESS.nameHe}</p>
              <p className="text-xs text-graphite-soft/70">{BUSINESS.nameEn}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-graphite-soft/80">
            חנות מוצרי חשמל בנהריה, משרתת לקוחות פרטיים בכל הצפון — מקו חיפה ועד הגבול הצפוני — עם משלוח
            והתקנה עד בית הלקוח ויחס אישי. האתר משמש כקטלוג להתרשמות נוחה, בדיקת זמינות ראשונית, וקשר ישיר מול
            צוות החנות.
          </p>
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
                עמוד הפייסבוק שלנו
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

        <FooterColumn title="קטלוג" links={CATALOG_LINKS} />
        <FooterColumn title="החברה" links={COMPANY_LINKS} />
        <FooterColumn title="אזורי שירות" links={LOCAL_LINKS} />
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-graphite-soft/60 md:flex-row">
          <p>
            © {new Date().getFullYear()} {BUSINESS.nameHe}. כל הזכויות שמורות.
          </p>
          <ul className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((link) => (
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
