"use client";

export function LogoutButton() {
  async function logout() {
    try {
      await fetch("/api/admin-login", { method: "DELETE" });
    } finally {
      window.location.reload();
    }
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
    >
      התנתקות
    </button>
  );
}
