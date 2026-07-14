"use client";

import { useState } from "react";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        data.error === "not_configured"
          ? "לוח הבקרה לא הוגדר: יש להגדיר ADMIN_PASSWORD בהגדרות השרת."
          : "סיסמה שגויה. נסו שוב."
      );
    } catch {
      setError("שגיאת רשת. נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-xl font-bold text-graphite">לוח בקרה — כניסת מנהל</h1>
        <p className="mt-1 text-sm text-graphite-soft/70">אזור מוגן. הכניסו סיסמה כדי להמשיך.</p>

        {!configured && (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            טרם הוגדרה סיסמה. הגדירו את משתנה הסביבה <code className="font-mono">ADMIN_PASSWORD</code> ב-Vercel.
          </p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            autoComplete="current-password"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-graphite outline-none focus:border-brand-blue"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-graphite px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-graphite-soft disabled:opacity-60"
          >
            {loading ? "מתחבר…" : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
