import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "English — Coming Soon | Hadad Electric" },
  description: "The English version of this site is coming soon. Please visit the Hebrew site for now.",
  robots: { index: false, follow: true },
};

/**
 * TODO: build the full English site once translated content is ready.
 * Kept intentionally minimal (noindex) to avoid thin/duplicate-content
 * pages harming SEO before real translations exist.
 */
export default function EnglishComingSoonPage() {
  return (
    <div dir="ltr" lang="en" className="container-page py-20 text-center">
      <h1 className="text-3xl font-bold text-graphite">English site — coming soon</h1>
      <p className="mx-auto mt-4 max-w-xl text-graphite-soft/80">
        {BUSINESS.nameEn} is currently available in Hebrew. An English version of this site is planned for the
        future. Meanwhile, you are welcome to browse the Hebrew catalog or contact us directly.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
        >
          Visit Hebrew site
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-graphite hover:bg-surface"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
