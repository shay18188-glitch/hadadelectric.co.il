"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/analytics/leads";

type Filter = "all" | "new" | "handled";

/** Israeli phone → wa.me international form (0501234567 → 972501234567). */
function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

function formatWhen(ts: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadsPanel({ leads: initial }: { leads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const newCount = useMemo(() => leads.filter((l) => l.status === "new").length, [leads]);
  const visible = useMemo(
    () => (filter === "all" ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter]
  );

  async function setStatus(id: string, status: Lead["status"]) {
    setBusyId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l))); // optimistic
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("למחוק את הפנייה לצמיתות?")) return;
    setBusyId(id);
    setLeads((prev) => prev.filter((l) => l.id !== id)); // optimistic
    try {
      await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "הכול", count: leads.length },
    { key: "new", label: "חדשות", count: newCount },
    { key: "handled", label: "טופלו", count: leads.length - newCount },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-graphite md:text-2xl">
          פניות מהאתר
          {newCount > 0 && (
            <span className="ms-2 inline-flex items-center rounded-full bg-brand-blue px-2.5 py-0.5 text-xs font-bold text-white align-middle">
              {newCount} חדשות
            </span>
          )}
        </h2>
        <div className="inline-flex rounded-full border border-line bg-white p-1 text-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                filter === t.key ? "bg-graphite text-white" : "text-graphite-soft/70 hover:text-graphite"
              }`}
            >
              {t.label} <span className="opacity-70">({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-graphite-soft/50">
          {leads.length === 0
            ? "עדיין לא התקבלו פניות מטופס יצירת הקשר."
            : "אין פניות בקטגוריה זו."}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((lead) => (
            <li
              key={lead.id}
              className={`rounded-2xl border p-4 md:p-5 ${
                lead.status === "new" ? "border-brand-blue/30 bg-brand-blue-light/40" : "border-line bg-white"
              } ${busyId === lead.id ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-graphite">{lead.name || "ללא שם"}</span>
                    {lead.status === "new" ? (
                      <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[11px] font-semibold text-brand-blue">
                        חדשה
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                        טופלה
                      </span>
                    )}
                    {lead.product && (
                      <span className="truncate rounded-full bg-surface px-2 py-0.5 text-[11px] text-graphite-soft/70">
                        מוצר: {lead.product}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-graphite-soft/50">{formatWhen(lead.ts)}</p>
                </div>
              </div>

              {lead.message && (
                <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-surface/60 p-3 text-sm text-graphite">
                  {lead.message}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {lead.phone && (
                  <>
                    <a
                      href={`https://wa.me/${waNumber(lead.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      וואטסאפ
                    </a>
                    <a
                      href={`tel:${lead.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-graphite hover:border-brand-blue/40"
                    >
                      {lead.phone}
                    </a>
                  </>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-graphite hover:border-brand-blue/40"
                  >
                    {lead.email}
                  </a>
                )}

                <span className="mx-1 h-4 w-px bg-line" aria-hidden />

                {lead.status === "new" ? (
                  <button
                    type="button"
                    disabled={busyId === lead.id}
                    onClick={() => setStatus(lead.id, "handled")}
                    className="rounded-full bg-graphite px-3 py-1.5 text-xs font-semibold text-white hover:bg-graphite-soft disabled:opacity-50"
                  >
                    סמן כטופל
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === lead.id}
                    onClick={() => setStatus(lead.id, "new")}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-graphite hover:border-brand-blue/40 disabled:opacity-50"
                  >
                    החזר לחדשות
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === lead.id}
                  onClick={() => remove(lead.id)}
                  className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  מחק
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
