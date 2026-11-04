"use client";

// -----------------------------------------------------------------------------
// Antwortzeit-Analyse: Wie schnell melden sich Unternehmen? Kennzahlen,
// Verteilung in Zeitfenstern und Vergleich nach Quelle (siehe
// src/lib/analytics/responseTime.ts). Nur EINE Kennzahl je Diagramm, daher
// genügt ein einzelner Akzentton.
// -----------------------------------------------------------------------------
import { useId } from "react";
import { Timer, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_PORTALS, findStatusMeta } from "@/lib/core/constants";
import type { ResponseTimeStats } from "@/lib/analytics/responseTime";

function sourceLabel(source: string): string {
  if (source === "UNKNOWN") return "Sonstige / Unbekannt";
  return findStatusMeta(JOB_PORTALS, source)?.label ?? source;
}

function days(value: number | null): string {
  return value === null ? "—" : `${value} ${value === 1 ? "Tag" : "Tage"}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-hover/40 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function ResponseTimeCard({ stats }: { stats?: ResponseTimeStats }) {
  const distributionId = useId();
  const sourceId = useId();

  if (!stats || stats.sampleSize === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" /> Antwortzeit-Analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Noch keine Rückmeldungen mit Bewerbungsdatum erfasst. Sobald Unternehmen antworten (Interview, Zusage oder
            Absage), siehst du hier, wie lange das im Schnitt dauert.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxBucket = Math.max(1, ...stats.buckets.map((b) => b.count));
  const maxSourceDays = Math.max(1, ...stats.bySource.map((s) => s.avgDays));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" /> Antwortzeit-Analyse
        </CardTitle>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tage von der Bewerbung bis zur ersten Reaktion ({stats.sampleSize}{" "}
          {stats.sampleSize === 1 ? "Rückmeldung" : "Rückmeldungen"} ausgewertet).
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Durchschnitt" value={days(stats.avgDays)} />
          <Metric label="Median" value={days(stats.medianDays)} />
          <Metric label="Schnellste" value={days(stats.fastestDays)} />
          <Metric label="Langsamste" value={days(stats.slowestDays)} />
        </div>

        {stats.followUpHint && (
          <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary-soft/30 p-3.5 text-xs text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>{stats.followUpHint}</p>
          </div>
        )}

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Verteilung der Antwortzeiten
          </h4>
          <div role="img" aria-labelledby={distributionId} className="flex flex-col gap-2.5">
            <span id={distributionId} className="sr-only">
              Anzahl Rückmeldungen je Zeitfenster
            </span>
            {stats.buckets.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{bucket.label}</span>
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: bucket.count === 0 ? "0%" : `${Math.max((bucket.count / maxBucket) * 100, 4)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-foreground">
                  <span className="font-semibold">{bucket.count}</span>{" "}
                  <span className="text-muted-foreground">({bucket.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {stats.bySource.length > 0 && (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Durchschnittliche Antwortzeit nach Quelle
            </h4>
            <div role="img" aria-labelledby={sourceId} className="flex flex-col gap-2.5">
              <span id={sourceId} className="sr-only">
                Durchschnittliche Antwortzeit in Tagen je Quelle
              </span>
              {stats.bySource.map((row) => (
                <div key={row.source} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{sourceLabel(row.source)}</span>
                  <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${Math.max((row.avgDays / maxSourceDays) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums text-foreground">
                    <span className="font-semibold">Ø {row.avgDays} d</span>{" "}
                    <span className="text-muted-foreground">({row.count})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
