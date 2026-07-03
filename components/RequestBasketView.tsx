"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRequestBasket } from "@/components/RequestBasketProvider";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppBasketMessage, buildWhatsAppUrl } from "@/lib/whatsapp/messages";

export function RequestBasketView() {
  const { items, removeItem, clear, isReady } = useRequestBasket();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  if (!isReady) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <p className="text-graphite-soft/80">הבקשה שלכם ריקה כרגע.</p>
        <Link
          href="/products"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-semibold text-white hover:bg-graphite-soft"
        >
          צפו בקטלוג
        </Link>
      </div>
    );
  }

  const whatsappMessage = buildWhatsAppBasketMessage(items, { name, phone, notes });

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.modelNumber}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                <Image
                  src={item.imageUrl || "/images/product-placeholder.svg"}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-1.5"
                />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${encodeURIComponent(item.slug)}`} className="font-semibold text-graphite hover:underline">
                  {item.name}
                </Link>
                <p className="text-xs text-graphite-soft/60">
                  {item.brand ? `${item.brand} · ` : ""}מק״ט: {item.modelNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeItem(item.modelNumber);
                  trackEvent("product_remove_from_request", { model_number: item.modelNumber });
                }}
                aria-label={`הסרת ${item.name} מהבקשה`}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-graphite-soft/70 hover:bg-surface hover:text-graphite"
              >
                הסרה
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={clear}
          className="mt-4 text-sm font-semibold text-graphite-soft/70 hover:text-graphite hover:underline"
        >
          ניקוי הבקשה
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-24 lg:h-fit">
        <h2 className="text-lg font-bold text-graphite">פרטים לשליחה (לא חובה)</h2>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="שם מלא" value={name} onChange={setName} autoComplete="name" />
          <Field label="טלפון" value={phone} onChange={setPhone} type="tel" autoComplete="tel" />
          <div>
            <label htmlFor="basket-notes" className="mb-1 block text-sm font-medium text-graphite">
              הערות
            </label>
            <textarea
              id="basket-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        </div>

        <a
          href={buildWhatsAppUrl(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_click_basket", { items_count: items.length })}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1fbd5a]"
        >
          שלח בקשה מרוכזת בוואטסאפ
        </a>
        <p className="mt-3 text-xs text-graphite-soft/60">
          אין באתר מחירים או סליקה. לבדיקת זמינות והזמנה ניתן לפנות בוואטסאפ או בטלפון — זמינות המלאי כפופה לאישור
          החנות.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const id = `basket-${label}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-graphite">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      />
    </div>
  );
}
