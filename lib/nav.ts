export const NAV_LINKS = [
  { href: "/products", label: "קטלוג" },
  { href: "/categories", label: "קטגוריות" },
  { href: "/brands", label: "מותגים" },
  { href: "/guides", label: "מדריכים" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
] as const;

export const MOBILE_NAV_ICONS: Record<(typeof NAV_LINKS)[number]["href"], string> = {
  "/products": "M4 5h7v7H4V5Zm9 0h7v7h-7V5ZM4 14h7v5H4v-5Zm9 0h7v5h-7v-5Z",
  "/categories": "M4 6h16M4 12h16M4 18h10",
  "/brands": "M20 12.5 12.5 20 4 11.5V4h7.5L20 12.5Zm-11-4.5h.01",
  "/guides": "M5 4h10l4 4v12H5V4Zm10 0v4h4M9 13h6M9 16h6",
  "/about": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5.5h.01M11 11h2v6h-2",
  "/contact": "M4 6h16v12H4V6Zm0 0 8 7 8-7",
};
