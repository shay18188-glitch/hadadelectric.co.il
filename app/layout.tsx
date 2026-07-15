import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RequestBasketProvider } from "@/components/RequestBasketProvider";
import { Analytics } from "@/components/Analytics";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { A11Y_BOOTSTRAP_SCRIPT } from "@/lib/a11y/apply";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/schema/jsonld";
import { absoluteUrl } from "@/lib/utils";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/metadata";

const rubik = Rubik({
  subsets: ["hebrew", "latin", "cyrillic"],
  variable: "--font-rubik",
  display: "swap",
});

// Hebrew owns the root URLs, so the server renders lang=he-IL dir=rtl. For the
// /en and /ru sections this inline script flips the document language and
// direction before first paint (no RTL flash); suppressHydrationWarning on
// <html> covers the attribute delta.
const LOCALE_BOOTSTRAP_SCRIPT = `(function(){var p=location.pathname;var l=p==="/en"||p.indexOf("/en/")===0?"en":p==="/ru"||p.indexOf("/ru/")===0?"ru":null;if(l){var d=document.documentElement;d.lang=l;d.dir="ltr";}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: `חנות מוצרי חשמל בנהריה והצפון — מקררים, מזגנים, טלוויזיות | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
    languages: {
      "he-IL": absoluteUrl("/"),
      en: absoluteUrl("/en"),
      ru: absoluteUrl("/ru"),
      "x-default": absoluteUrl("/"),
    },
  },
  openGraph: {
    title: `חנות מוצרי חשמל בנהריה והצפון | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  // Single source of truth for icons: static, stable-URL files in /public
  // (square Hadad "atom + E" mark, legible at favicon sizes). We do NOT use the
  // app/ icon file conventions (they emit hashed URLs and competed with these),
  // so no app/favicon.ico, app/icon.png or app/apple-icon.png should exist.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he-IL" dir="rtl" data-scroll-behavior="smooth" className={`${rubik.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOTSTRAP_SCRIPT }} />
        <a href="#main-content" className="skip-link">
          דלג לתוכן הראשי
        </a>
        <JsonLd data={[organizationJsonLd(), localBusinessJsonLd(), websiteJsonLd()]} />
        <RequestBasketProvider>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </RequestBasketProvider>
        <AccessibilityWidget />
        <Analytics />
      </body>
    </html>
  );
}
