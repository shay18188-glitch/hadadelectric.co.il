import type { Product, RequestBasketItem } from "@/types/product";
import { absoluteUrl } from "@/lib/utils";

export const WHATSAPP_PHONE_INTL = "972522692235";
export const STORE_PHONE_DISPLAY = "04-9920948";
export const STORE_MOBILE_DISPLAY = "052-2692235";

function productUrl(slug: string): string {
  return absoluteUrl(`/products/${encodeURIComponent(slug)}`);
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE_INTL}?text=${encodeURIComponent(message)}`;
}

const PRODUCT_MESSAGE_TEXT = {
  he: { intro: "שלום יובל, אני מעוניין לבדוק זמינות/להזמין את המוצר:", model: "מק״ט/דגם", link: "קישור", thanks: "תודה." },
  en: { intro: "Hello, I'd like to check availability / order this product:", model: "Model", link: "Link", thanks: "Thank you." },
  ru: { intro: "Здравствуйте! Хочу проверить наличие / заказать этот товар:", model: "Модель", link: "Ссылка", thanks: "Спасибо." },
} as const;

export function buildWhatsAppProductMessage(
  product: Pick<Product, "name" | "modelNumber" | "slug">,
  locale: keyof typeof PRODUCT_MESSAGE_TEXT = "he"
): string {
  const t = PRODUCT_MESSAGE_TEXT[locale];
  return [
    t.intro,
    product.name,
    `${t.model}: ${product.modelNumber}`,
    `${t.link}: ${productUrl(product.slug)}`,
    t.thanks,
  ].join("\n");
}

export interface BasketCustomerDetails {
  name?: string;
  phone?: string;
  notes?: string;
}

export function buildWhatsAppBasketMessage(
  products: RequestBasketItem[],
  customer?: BasketCustomerDetails
): string {
  const lines: string[] = ["שלום יובל, אני מעוניין לבדוק זמינות/להזמין את המוצרים הבאים:", ""];

  products.forEach((product, index) => {
    lines.push(`${index + 1}. ${product.name}`);
    lines.push(`דגם/מק״ט: ${product.modelNumber}`);
    lines.push(`קישור: ${productUrl(product.slug)}`);
    lines.push("");
  });

  if (customer?.name) lines.push(`שם: ${customer.name}`);
  if (customer?.phone) lines.push(`טלפון: ${customer.phone}`);
  if (customer?.notes) lines.push(`הערות: ${customer.notes}`);

  lines.push("תודה.");

  return lines.join("\n");
}

const GENERAL_MESSAGES = {
  he: "שלום, אשמח לקבל מידע נוסף על מוצרי חשמל בחדד יובל אלקטריק.",
  en: "Hello, I'd like more information about home appliances at Hadad Electric.",
  ru: "Здравствуйте! Я хотел(а) бы получить информацию о бытовой технике в магазине Hadad Electric.",
} as const;

export function buildWhatsAppGeneralMessage(locale: keyof typeof GENERAL_MESSAGES = "he"): string {
  return GENERAL_MESSAGES[locale];
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
