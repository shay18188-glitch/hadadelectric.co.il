export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hadadelectric.co.il").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const BUSINESS = {
  nameHe: "חדד יובל אלקטריק בע״מ",
  nameEn: "Hadad Electric",
  addressStreet: "לוחמי הגטאות 3",
  addressCity: "נהריה",
  phoneDisplay: "04-9920948",
  phoneHref: "tel:0499920948",
  mobileDisplay: "052-2692235",
  facebookUrl: "https://www.facebook.com/Hadad.Electric",
} as const;
