"use client";

import { useEffect } from "react";

/**
 * The last boundary: a failure in the root layout itself, which `error.tsx`
 * sits inside and therefore cannot catch.
 *
 * This one replaces the document, so it must ship its own <html> and <body>
 * and must not import the layout's fonts, providers or CSS-dependent
 * components — whatever broke may be exactly one of those. Styles are
 * inline for the same reason.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <html lang="he-IL" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#fbfaf7",
          color: "#0b1724",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.75rem" }}>
            האתר נתקל בתקלה
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.7, color: "#253342" }}>
            אנחנו כבר יודעים על זה. אפשר לרענן את העמוד, או להתקשר אלינו ישירות
            לחדד יובל אלקטריק בנהריה.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: "999px",
                background: "#0b5793",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              רענון
            </button>
            <a
              href="tel:049920948"
              style={{
                borderRadius: "999px",
                border: "1px solid #dedbd4",
                background: "#fff",
                color: "#0b1724",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              04-9920948
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
