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

export function buildWhatsAppProductMessage(product: Pick<Product, "name" | "modelNumber" | "slug">): string {
  return [
    "שלום יובל, אני מעוניין לבדוק זמינות/להזמין את המוצר:",
    product.name,
    `מק״ט/דגם: ${product.modelNumber}`,
    `קישור: ${productUrl(product.slug)}`,
    "תודה.",
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

export function buildWhatsAppGeneralMessage(): string {
  return "שלום, אשמח לקבל מידע נוסף על מוצרי חשמל בחדד יובל אלקטריק.";
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
