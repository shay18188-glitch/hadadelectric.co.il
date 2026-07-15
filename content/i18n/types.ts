import type { FaqEntry } from "@/content/faq";

/** Full page content for one non-Hebrew locale (en/ru). */
export interface LocalePageContent {
  home: {
    metaTitle: string;
    metaDescription: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaWhatsApp: string;
    ctaPhone: string;
    ctaCatalog: string;
    categoriesTitle: string;
    categoriesIntro: string;
    categories: { href: string; label: string }[];
    whyTitle: string;
    why: { title: string; desc: string }[];
    seoTitle: string;
    seoParagraphs: string[];
    areasTitle: string;
    areasIntro: string;
    notice: string;
    faqTitle: string;
    faqMore: string;
    contactTitle: string;
    contactSubtitle: string;
  };
  about: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    sections: { title: string; paragraphs: string[] }[];
  };
  contact: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    detailsTitle: string;
    addressLine: string;
    phoneLabel: string;
    whatsappLabel: string;
    hoursTitle: string;
    hours: { day: string; hours: string }[];
    hoursNote: string;
    usefulTitle: string;
    usefulLinks: { href: string; label: string }[];
    formTitle: string;
    formIntro: string;
    privacyNote: string;
    privacyLinkLabel: string;
    mapTitle: string;
  };
  delivery: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    sections: { title: string; paragraphs: string[] }[];
    areasTitle: string;
    areasIntro: string;
    ctaTitle: string;
    ctaSubtitle: string;
  };
  faq: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    intro: string;
    categories: { title: string; items: FaqEntry[] }[];
    ctaTitle: string;
    ctaSubtitle: string;
  };
}
