"use client"; // Error boundaries müssen Client Components sein (Next.js-Konvention)

// -----------------------------------------------------------------------------
// Route-Segment Error Boundary (app/error.tsx)
// -----------------------------------------------------------------------------
// Fängt unerwartete Laufzeitfehler in `page.tsx`/verschachtelten Segmenten ab
// und zeigt eine UI im App-Design statt des rohen Next.js-Fehlerbildschirms.
// Wrapt NICHT das Root-Layout (Sidebar bleibt sichtbar, Fehler betrifft nur
// den Hauptinhalt) — für Fehler im Root-Layout selbst siehe global-error.tsx.
//
// Next.js 16.3+ übergibt `retry()` statt des älteren `reset()` (siehe
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md,
// "retry() wurde in v16.3.0 stabil" — `reset()` existiert nur noch als
// Sonderfall für "Fehlerzustand löschen, ohne neu zu fetchen").
// -----------------------------------------------------------------------------
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unerwarteter Fehler in einem Route-Segment:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-6 w-6 text-danger" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Etwas ist schiefgelaufen</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Diese Ansicht konnte nicht geladen werden. Das kann an einer vorübergehenden Störung liegen — ein
              erneuter Versuch hilft oft weiter.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">Fehler-ID: {error.digest}</p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => retry()}>
              <RotateCw className="h-4 w-4" /> Erneut versuchen
            </Button>
            <Link href="/">
              <Button variant="outline">
                <Home className="h-4 w-4" /> Zum Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
