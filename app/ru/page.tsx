import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Русская версия скоро | Hadad Electric" },
  description: "Русская версия сайта появится в ближайшее время. Пока доступна ивритская версия сайта.",
  robots: { index: false, follow: true },
};

/**
 * TODO: build the full Russian site once translated content is ready.
 * Kept intentionally minimal (noindex) to avoid thin/duplicate-content
 * pages harming SEO before real translations exist.
 */
export default function RussianComingSoonPage() {
  return (
    <div dir="ltr" lang="ru" className="container-page py-20 text-center">
      <h1 className="text-3xl font-bold text-graphite">Русская версия сайта — скоро</h1>
      <p className="mx-auto mt-4 max-w-xl text-graphite-soft/80">
        {BUSINESS.nameEn} на данный момент доступен на иврите. Русская версия сайта планируется в будущем. А пока
        приглашаем вас ознакомиться с каталогом или связаться с нами напрямую.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
        >
          Перейти на сайт на иврите
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-graphite hover:bg-surface"
        >
          Связаться с нами
        </Link>
      </div>
    </div>
  );
}
