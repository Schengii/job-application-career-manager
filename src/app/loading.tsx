// -----------------------------------------------------------------------------
// Route-Segment Loading UI (app/loading.tsx)
// -----------------------------------------------------------------------------
// Next.js zeigt diese Datei automatisch (in eine <Suspense>-Grenze
// verpackt), während der Code/die Daten eines Route-Segments geladen werden
// — z.B. beim erstmaligen Laden des JS-Chunks einer Seite wie /analytics
// oder /cv-designer über eine langsamere Verbindung. Die meisten Seiten in
// dieser App laden ihre eigentlichen Daten client-seitig per SWR (siehe
// z.B. src/app/page.tsx) und haben daher bereits eigene Skeleton-/
// Ladezustände; dieses Skelett deckt die kurze Lücke davor ab, statt eines
// komplett leeren Bildschirms.
// -----------------------------------------------------------------------------
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-6 w-48 animate-pulse rounded-md bg-surface-hover" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-surface-hover" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}
