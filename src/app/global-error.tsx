"use client"; // Error boundaries müssen Client Components sein (Next.js-Konvention)

// -----------------------------------------------------------------------------
// Root-Layout Error Boundary (app/global-error.tsx)
// -----------------------------------------------------------------------------
// Greift nur, wenn der Fehler im Root-Layout selbst passiert (also bevor
// Sidebar/ThemeProvider/ToastProvider überhaupt gerendert werden) — der
// deutlich häufigere Fall "Fehler in einer einzelnen Seite" wird bereits von
// app/error.tsx abgefangen. Muss laut Next.js-Konvention <html>/<body> selbst
// definieren, da es das Root-Layout komplett ersetzt, und bekommt bewusst
// KEIN next-themes/`ThemeProvider` (das ist Teil des ausgefallenen Layouts)
// — daher rein inline gestylt mit einer `prefers-color-scheme`-Media-Query
// statt der App-eigenen CSS-Variablen aus globals.css.
// -----------------------------------------------------------------------------
import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Kritischer Fehler im Root-Layout:", error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ margin: 0 }}>
        <style>{`
          :root { color-scheme: light dark; }
          body {
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            background: #f8fafc;
            color: #0f172a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #0b0f19; color: #e2e8f0; }
            .card { background: #131a2b !important; border-color: #263045 !important; }
            .muted { color: #94a3b8 !important; }
            .btn-outline { border-color: #263045 !important; color: #e2e8f0 !important; }
          }
        `}</style>
        <div
          className="card"
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "2.5rem 1.75rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "9999px",
              background: "rgba(220, 38, 38, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: 22,
            }}
          >
            ⚠️
          </div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0 }}>
            Die Anwendung konnte nicht geladen werden
          </h2>
          <p className="muted" style={{ marginTop: 8, fontSize: "0.875rem", color: "#64748b", lineHeight: 1.5 }}>
            Ein unerwarteter Fehler hat den Aufbau der Seite verhindert. Ein Neuladen behebt das Problem meistens.
          </p>
          {error.digest && (
            <p className="muted" style={{ marginTop: 8, fontFamily: "monospace", fontSize: "0.7rem", color: "#94a3b8" }}>
              Fehler-ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => retry()}
            style={{
              marginTop: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 500,
              fontSize: "0.875rem",
              padding: "0.6rem 1.1rem",
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
