import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RequestBasketProvider } from "@/components/RequestBasketProvider";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/schema/jsonld";
import { absoluteUrl } from "@/lib/utils";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/metadata";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: `${SITE_NAME} — מוצרי חשמל בנהריה והצפון`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
    languages: {
      "he-IL": absoluteUrl("/"),
      "x-default": absoluteUrl("/"),
    },
  },
  openGraph: {
    title: `${SITE_NAME} — מוצרי חשמל בנהריה והצפון`,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he-IL" dir="rtl" data-scroll-behavior="smooth" className={`${rubik.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
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
        <Analytics />
      </body>
    </html>
  );
}
