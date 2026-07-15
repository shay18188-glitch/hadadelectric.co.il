"use client";

import { useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n/locales";

type Status = "idle" | "submitting" | "success" | "error";

const FORM_TEXT: Record<
  Locale,
  {
    successTitle: string;
    successBody: string;
    honeypot: string;
    name: string;
    phone: string;
    email: string;
    product: string;
    message: string;
    consent: string;
    error: string;
    submitting: string;
    submit: string;
  }
> = {
  he: {
    successTitle: "ההודעה נשלחה בהצלחה!",
    successBody: "צוות חדד יובל אלקטריק יחזור אליכם בהקדם.",
    honeypot: "אל תמלאו שדה זה",
    name: "שם מלא",
    phone: "טלפון",
    email: "אימייל (לא חובה)",
    product: "מוצר רלוונטי (לא חובה)",
    message: "הודעה",
    consent: "אני מאשר/ת שהפרטים שמסרתי ישמשו את חדד יובל אלקטריק בע״מ לצורך יצירת קשר בלבד.",
    error: "אירעה שגיאה בשליחת הטופס. ניתן לנסות שוב, או לפנות אלינו ישירות בוואטסאפ או בטלפון.",
    submitting: "שולח...",
    submit: "שליחת הודעה",
  },
  en: {
    successTitle: "Your message was sent!",
    successBody: "The Hadad Electric team will get back to you shortly.",
    honeypot: "Leave this field empty",
    name: "Full name",
    phone: "Phone",
    email: "Email (optional)",
    product: "Relevant product (optional)",
    message: "Message",
    consent: "I agree that the details I provided will be used by Hadad Yuval Electric Ltd. only to contact me.",
    error: "Something went wrong while sending the form. Please try again, or contact us directly on WhatsApp or by phone.",
    submitting: "Sending...",
    submit: "Send message",
  },
  ru: {
    successTitle: "Сообщение отправлено!",
    successBody: "Команда Hadad Electric свяжется с вами в ближайшее время.",
    honeypot: "Не заполняйте это поле",
    name: "Полное имя",
    phone: "Телефон",
    email: "Эл. почта (необязательно)",
    product: "Интересующий товар (необязательно)",
    message: "Сообщение",
    consent: "Я согласен(на), что указанные данные будут использованы компанией Hadad Yuval Electric Ltd. только для связи со мной.",
    error: "Не удалось отправить форму. Попробуйте ещё раз или свяжитесь с нами напрямую в WhatsApp или по телефону.",
    submitting: "Отправка...",
    submit: "Отправить сообщение",
  },
};

export function ContactForm({ locale = "he" }: { locale?: Locale }) {
  const [status, setStatus] = useState<Status>("idle");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const t = FORM_TEXT[locale];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      relevantProduct: String(data.get("relevantProduct") ?? ""),
      company: String(data.get("company") ?? ""),
      privacyAccepted,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      trackEvent("contact_form_submit");
      form.reset();
      setPrivacyAccepted(false);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-success/30 bg-success-bg p-6 text-success">
        <p className="font-semibold">{t.successTitle}</p>
        <p className="mt-1 text-sm">{t.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Honeypot: hidden from users, tempting to bots. Real submissions leave
          it empty; the server drops anything that fills it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden" style={{ position: "absolute" }}>
        <label htmlFor="company">{t.honeypot}</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="name" name="name" label={t.name} required autoComplete="name" />
        <FormField id="phone" name="phone" label={t.phone} type="tel" required autoComplete="tel" />
      </div>
      <FormField id="email" name="email" label={t.email} type="email" autoComplete="email" />
      <FormField id="relevantProduct" name="relevantProduct" label={t.product} />
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-graphite">
          {t.message} <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-graphite-soft/80">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          required
          className="mt-1 h-4 w-4 rounded border-line text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
        />
        {t.consent}
      </label>

      {status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {t.error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || !privacyAccepted}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-graphite px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-graphite-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? t.submitting : t.submit}
      </button>
    </form>
  );
}

function FormField({
  id,
  name,
  label,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-graphite">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      />
    </div>
  );
}
