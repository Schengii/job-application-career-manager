// -----------------------------------------------------------------------------
// Antwortzeit-Analyse
// -----------------------------------------------------------------------------
// Wie viele Tage vergehen zwischen Bewerbungsdatum und der ersten Reaktion des
// Unternehmens (Interview, Zusage oder Absage)? Liefert Durchschnitt, Median,
// 90-%-Perzentil, eine Verteilung in Zeitfenstern und eine Aufschlüsselung nach
// Quelle (Portal) — und daraus einen Hinweis, ab wann Nachfassen sinnvoll ist.
// Reine Funktionen ohne Datenbankzugriff, damit sie einfach testbar sind.
// -----------------------------------------------------------------------------

/** Status, die eine Reaktion des Unternehmens bedeuten (Eingangsbestätigungen zählen nicht). */
export const RESPONSE_STATUSES: ReadonlySet<string> = new Set(["INTERVIEW", "OFFER", "REJECTED"]);

const MS_PER_DAY = 86_400_000;
/** Ab wie vielen Antworten ein Nachfass-Hinweis statistisch vertretbar ist. */
const MIN_SAMPLES_FOR_HINT = 5;

export type ResponseTimeInput = {
  applicationDate?: Date | string | null;
  source?: string | null;
  statusEvents: { status: string; changedAt: Date | string }[];
};

export type ResponseDuration = { days: number; source: string | null };

export type ResponseTimeBucket = {
  label: string;
  count: number;
  /** Anteil an allen ausgewerteten Antworten in Prozent (gerundet). */
  pct: number;
};

export type SourceResponseTime = {
  source: string;
  count: number;
  avgDays: number;
  medianDays: number;
};

export type ResponseTimeStats = {
  /** Anzahl Bewerbungen mit auswertbarer Antwortzeit. */
  sampleSize: number;
  avgDays: number | null;
  medianDays: number | null;
  fastestDays: number | null;
  slowestDays: number | null;
  /** 90 % aller Antworten kamen innerhalb dieser Tage. */
  p90Days: number | null;
  buckets: ResponseTimeBucket[];
  bySource: SourceResponseTime[];
  followUpHint: string | null;
};

const BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: "0–3 Tage", min: 0, max: 3 },
  { label: "4–7 Tage", min: 4, max: 7 },
  { label: "8–14 Tage", min: 8, max: 14 },
  { label: "15–30 Tage", min: 15, max: 30 },
  { label: "über 30 Tage", min: 31, max: null },
];

/**
 * Tage zwischen Bewerbungsdatum und erster Reaktion je Bewerbung. Bewerbungen
 * ohne Bewerbungsdatum, ohne Reaktion oder mit negativer Dauer (Datenfehler)
 * werden übersprungen.
 */
export function computeResponseDurations(applications: ResponseTimeInput[]): ResponseDuration[] {
  const result: ResponseDuration[] = [];
  for (const app of applications) {
    if (!app.applicationDate) continue;

    let firstResponse: number | null = null;
    for (const event of app.statusEvents) {
      if (!RESPONSE_STATUSES.has(event.status)) continue;
      const time = new Date(event.changedAt).getTime();
      if (Number.isNaN(time)) continue;
      if (firstResponse === null || time < firstResponse) firstResponse = time;
    }
    if (firstResponse === null) continue;

    const days = Math.round((firstResponse - new Date(app.applicationDate).getTime()) / MS_PER_DAY);
    if (Number.isNaN(days) || days < 0) continue;
    result.push({ days, source: app.source ?? null });
  }
  return result;
}

function mean(values: number[]): number {
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/** Median einer aufsteigend sortierten Liste (bei gerader Anzahl Mittelwert der zwei mittleren, gerundet). */
function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Perzentil nach dem Nearest-Rank-Verfahren auf einer aufsteigend sortierten Liste. */
function percentile(sorted: number[], p: number): number {
  const rank = Math.ceil(p * sorted.length);
  return sorted[Math.max(0, rank - 1)];
}

export function computeResponseTimeStats(
  applications: ResponseTimeInput[],
  options: { minSourceSamples?: number } = {},
): ResponseTimeStats {
  const minSourceSamples = options.minSourceSamples ?? 2;
  const durations = computeResponseDurations(applications);

  if (durations.length === 0) {
    return {
      sampleSize: 0,
      avgDays: null,
      medianDays: null,
      fastestDays: null,
      slowestDays: null,
      p90Days: null,
      buckets: BUCKETS.map((b) => ({ label: b.label, count: 0, pct: 0 })),
      bySource: [],
      followUpHint: null,
    };
  }

  const days = durations.map((d) => d.days).sort((a, b) => a - b);
  const p90Days = percentile(days, 0.9);

  const buckets = BUCKETS.map((b) => {
    const count = days.filter((d) => d >= b.min && (b.max === null || d <= b.max)).length;
    return { label: b.label, count, pct: Math.round((count / days.length) * 100) };
  });

  const bySourceMap = new Map<string, number[]>();
  for (const d of durations) {
    const key = d.source ?? "UNKNOWN";
    bySourceMap.set(key, [...(bySourceMap.get(key) ?? []), d.days]);
  }
  const bySource = Array.from(bySourceMap.entries())
    .filter(([, list]) => list.length >= minSourceSamples)
    .map(([source, list]) => {
      const sorted = [...list].sort((a, b) => a - b);
      return { source, count: list.length, avgDays: mean(list), medianDays: median(sorted) };
    })
    .sort((a, b) => a.avgDays - b.avgDays || b.count - a.count);

  return {
    sampleSize: days.length,
    avgDays: mean(days),
    medianDays: median(days),
    fastestDays: days[0],
    slowestDays: days[days.length - 1],
    p90Days,
    buckets,
    bySource,
    followUpHint:
      days.length >= MIN_SAMPLES_FOR_HINT
        ? `9 von 10 Antworten kamen innerhalb von ${p90Days} ${p90Days === 1 ? "Tag" : "Tagen"} — wer danach noch nichts gehört hat, sollte nachfassen.`
        : null,
  };
}
