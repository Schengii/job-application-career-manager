// -----------------------------------------------------------------------------
// 404-Seite (app/not-found.tsx)
// -----------------------------------------------------------------------------
// Greift sowohl bei explizitem `notFound()`-Aufruf in einer Route (z.B. eine
// Bewerbung/Firma mit ungültiger ID unter /applications/[id]) als auch
// automatisch für jede nicht existierende URL im gesamten App-Router (siehe
// Next.js-Konvention für das Root-`app/not-found.tsx`). Läuft — anders als
// error.tsx — standardmäßig als Server Component, ist hier aber rein
// statisch und braucht daher keine Client-Interaktivität.
// -----------------------------------------------------------------------------
import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
            <SearchX className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Seite nicht gefunden</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Die aufgerufene Seite existiert nicht (mehr) — möglicherweise wurde der Eintrag gelöscht oder der Link
              ist veraltet.
            </p>
          </div>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4" /> Zum Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
