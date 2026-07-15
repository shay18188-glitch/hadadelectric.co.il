import type { Locale } from "@/lib/i18n/locales";

/**
 * Localized strings for the site chrome (header, mobile drawer, footer).
 * Catalog pages (products, categories, brands, guides, local pages) are
 * Hebrew-only for now, so en/ru nav points to them where useful and to the
 * translated pages elsewhere.
 */

export interface NavLink {
  href: string;
  label: string;
  /** SVG path for the mobile drawer icon. */
  icon: string;
}

const ICONS = {
  catalog: "M4 5h7v7H4V5Zm9 0h7v7h-7V5ZM4 14h7v5H4v-5Zm9 0h7v5h-7v-5Z",
  categories: "M4 6h16M4 12h16M4 18h10",
  brands: "M20 12.5 12.5 20 4 11.5V4h7.5L20 12.5Zm-11-4.5h.01",
  guides: "M5 4h10l4 4v12H5V4Zm10 0v4h4M9 13h6M9 16h6",
  about: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5.5h.01M11 11h2v6h-2",
  contact: "M4 6h16v12H4V6Zm0 0 8 7 8-7",
  delivery: "M3 7h11v8H3V7Zm11 3h4l3 3v2h-7v-5ZM7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  faq: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-2.5 6.5A2.5 2.5 0 0 1 12 7a2.5 2.5 0 0 1 1.5 4.5c-.8.6-1.5 1-1.5 2m0 3h.01",
} as const;

export interface ChromeDict {
  nav: NavLink[];
  header: {
    mainNavLabel: string;
    search: string;
    openMenu: string;
    menuTitle: string;
    languageLabel: string;
    chooseLanguage: string;
  };
  footer: {
    tagline: string;
    catalogTitle: string;
    catalogLinks: { href: string; label: string }[];
    companyTitle: string;
    companyLinks: { href: string; label: string }[];
    areasTitle: string;
    areasLinks: { href: string; label: string }[];
    facebook: string;
    rights: string;
    legalLinks: { href: string; label: string }[];
  };
}

export const CHROME: Record<Locale, ChromeDict> = {
  he: {
    nav: [
      { href: "/products", label: "קטלוג", icon: ICONS.catalog },
      { href: "/categories", label: "קטגוריות", icon: ICONS.categories },
      { href: "/brands", label: "מותגים", icon: ICONS.brands },
      { href: "/guides", label: "מדריכים", icon: ICONS.guides },
      { href: "/about", label: "אודות", icon: ICONS.about },
      { href: "/contact", label: "צור קשר", icon: ICONS.contact },
    ],
    header: {
      mainNavLabel: "ניווט ראשי",
      search: "חיפוש",
      openMenu: "פתח תפריט",
      menuTitle: "תפריט",
      languageLabel: "שפה",
      chooseLanguage: "בחירת שפה",
    },
    footer: {
      tagline:
        "חנות מוצרי חשמל בנהריה, משרתת לקוחות פרטיים בכל הצפון — מקו חיפה ועד הגבול הצפוני — עם משלוח והתקנה עד בית הלקוח ויחס אישי. האתר משמש כקטלוג להתרשמות נוחה, בדיקת זמינות ראשונית, וקשר ישיר מול צוות החנות.",
      catalogTitle: "קטלוג",
      catalogLinks: [
        { href: "/products", label: "כל המוצרים" },
        { href: "/categories", label: "קטגוריות" },
        { href: "/brands", label: "מותגים" },
        { href: "/guides", label: "מדריכים" },
        { href: "/request", label: "הבקשה שלי" },
      ],
      companyTitle: "החברה",
      companyLinks: [
        { href: "/about", label: "אודות" },
        { href: "/contact", label: "צור קשר" },
        { href: "/faq", label: "שאלות נפוצות" },
        { href: "/services/delivery", label: "משלוחים והתקנה בצפון" },
      ],
      areasTitle: "אזורי שירות",
      areasLinks: [
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
      ],
      facebook: "עמוד הפייסבוק שלנו",
      rights: "כל הזכויות שמורות.",
      legalLinks: [
        { href: "/privacy-policy", label: "מדיניות פרטיות" },
        { href: "/accessibility", label: "הצהרת נגישות" },
        { href: "/terms", label: "תנאי שימוש" },
      ],
    },
  },
  en: {
    nav: [
      { href: "/en/products", label: "Catalog", icon: ICONS.catalog },
      { href: "/en/guides", label: "Guides", icon: ICONS.guides },
      { href: "/en/delivery", label: "Delivery", icon: ICONS.delivery },
      { href: "/en/about", label: "About", icon: ICONS.about },
      { href: "/en/faq", label: "FAQ", icon: ICONS.faq },
      { href: "/en/contact", label: "Contact", icon: ICONS.contact },
    ],
    header: {
      mainNavLabel: "Main navigation",
      search: "Search",
      openMenu: "Open menu",
      menuTitle: "Menu",
      languageLabel: "Language",
      chooseLanguage: "Choose language",
    },
    footer: {
      tagline:
        "Home appliance store in Nahariya serving private customers across northern Israel — from the Haifa area up to the northern border — with delivery and installation to your home and personal service. The site is a catalog for browsing, checking availability and contacting the store team directly.",
      catalogTitle: "Catalog",
      catalogLinks: [
        { href: "/en/products", label: "All products" },
        { href: "/en/guides", label: "Buying guides" },
        { href: "/brands", label: "Brands (Hebrew)" },
        { href: "/request", label: "My request" },
      ],
      companyTitle: "Company",
      companyLinks: [
        { href: "/en/about", label: "About us" },
        { href: "/en/contact", label: "Contact" },
        { href: "/en/faq", label: "FAQ" },
        { href: "/en/delivery", label: "Delivery & installation" },
      ],
      areasTitle: "Service areas",
      areasLinks: [
        { href: "/electric-appliances-nahariya", label: "Nahariya" },
        { href: "/electric-appliances-acre", label: "Acre (Akko)" },
        { href: "/electric-appliances-krayot", label: "The Krayot" },
        { href: "/electric-appliances-haifa", label: "Haifa" },
        { href: "/electric-appliances-carmiel", label: "Karmiel" },
        { href: "/electric-appliances-maalot", label: "Ma'alot-Tarshiha" },
        { href: "/electric-appliances-nazareth", label: "Nazareth" },
        { href: "/electric-appliances-safed", label: "Safed" },
        { href: "/electric-appliances-tiberias", label: "Tiberias" },
        { href: "/electric-appliances-north", label: "All service areas" },
      ],
      facebook: "Our Facebook page",
      rights: "All rights reserved.",
      legalLinks: [
        { href: "/privacy-policy", label: "Privacy policy" },
        { href: "/accessibility", label: "Accessibility" },
        { href: "/terms", label: "Terms of use" },
      ],
    },
  },
  ru: {
    nav: [
      { href: "/ru/products", label: "Каталог", icon: ICONS.catalog },
      { href: "/ru/guides", label: "Гиды", icon: ICONS.guides },
      { href: "/ru/delivery", label: "Доставка", icon: ICONS.delivery },
      { href: "/ru/about", label: "О магазине", icon: ICONS.about },
      { href: "/ru/faq", label: "Вопросы", icon: ICONS.faq },
      { href: "/ru/contact", label: "Контакты", icon: ICONS.contact },
    ],
    header: {
      mainNavLabel: "Основная навигация",
      search: "Поиск",
      openMenu: "Открыть меню",
      menuTitle: "Меню",
      languageLabel: "Язык",
      chooseLanguage: "Выбор языка",
    },
    footer: {
      tagline:
        "Магазин бытовой техники в Нагарии. Обслуживаем частных клиентов по всему северу Израиля — от Хайфы до северной границы — с доставкой и установкой на дом и личным подходом. Сайт — это каталог для знакомства с ассортиментом, проверки наличия и прямой связи с командой магазина.",
      catalogTitle: "Каталог",
      catalogLinks: [
        { href: "/ru/products", label: "Все товары" },
        { href: "/ru/guides", label: "Гиды покупателя" },
        { href: "/brands", label: "Бренды (иврит)" },
        { href: "/request", label: "Моя заявка" },
      ],
      companyTitle: "Компания",
      companyLinks: [
        { href: "/ru/about", label: "О магазине" },
        { href: "/ru/contact", label: "Контакты" },
        { href: "/ru/faq", label: "Частые вопросы" },
        { href: "/ru/delivery", label: "Доставка и установка" },
      ],
      areasTitle: "Зоны обслуживания",
      areasLinks: [
        { href: "/electric-appliances-nahariya", label: "Нагария" },
        { href: "/electric-appliances-acre", label: "Акко" },
        { href: "/electric-appliances-krayot", label: "Крайот" },
        { href: "/electric-appliances-haifa", label: "Хайфа" },
        { href: "/electric-appliances-carmiel", label: "Кармиэль" },
        { href: "/electric-appliances-maalot", label: "Маалот-Таршиха" },
        { href: "/electric-appliances-nazareth", label: "Назарет" },
        { href: "/electric-appliances-safed", label: "Цфат" },
        { href: "/electric-appliances-tiberias", label: "Тверия" },
        { href: "/electric-appliances-north", label: "Все зоны обслуживания" },
      ],
      facebook: "Наша страница в Facebook",
      rights: "Все права защищены.",
      legalLinks: [
        { href: "/privacy-policy", label: "Политика конфиденциальности" },
        { href: "/accessibility", label: "Доступность" },
        { href: "/terms", label: "Условия использования" },
      ],
    },
  },
};
