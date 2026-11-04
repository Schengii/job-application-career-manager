import { describe, expect, it } from "vitest";
import { computeResponseDurations, computeResponseTimeStats, type ResponseTimeInput } from "./responseTime";

const BASE = new Date("2026-01-01T00:00:00Z");
const plusDays = (n: number) => new Date(BASE.getTime() + n * 86_400_000);

function app(responseAfterDays: number | null, over: Partial<ResponseTimeInput> = {}, status = "REJECTED"): ResponseTimeInput {
  return {
    applicationDate: BASE,
    source: null,
    statusEvents: responseAfterDays === null ? [{ status: "SENT", changedAt: plusDays(0) }] : [{ status, changedAt: plusDays(responseAfterDays) }],
    ...over,
  };
}

describe("computeResponseDurations", () => {
  it("nimmt die früheste Reaktion und ignoriert Eingangsbestätigungen", () => {
    const result = computeResponseDurations([
      {
        applicationDate: BASE,
        statusEvents: [
          { status: "SENT", changedAt: plusDays(1) },
          { status: "REJECTED", changedAt: plusDays(20) },
          { status: "INTERVIEW", changedAt: plusDays(6) },
        ],
      },
    ]);
    expect(result).toEqual([{ days: 6, source: null }]);
  });

  it("überspringt fehlendes Datum, fehlende Reaktion, negative Dauer und ungültige Daten", () => {
    expect(
      computeResponseDurations([
        app(5, { applicationDate: null }),
        app(null),
        app(-3),
        { applicationDate: BASE, statusEvents: [{ status: "OFFER", changedAt: "kein-datum" }] },
      ]),
    ).toEqual([]);
  });

  it("akzeptiert ISO-Strings (wie aus der API)", () => {
    const result = computeResponseDurations([
      { applicationDate: "2026-01-01", source: "INDEED", statusEvents: [{ status: "OFFER", changedAt: "2026-01-11T00:00:00Z" }] },
    ]);
    expect(result).toEqual([{ days: 10, source: "INDEED" }]);
  });
});

describe("computeResponseTimeStats", () => {
  it("liefert ohne Daten leere Werte und Null-Buckets", () => {
    const stats = computeResponseTimeStats([app(null)]);
    expect(stats.sampleSize).toBe(0);
    expect(stats.avgDays).toBeNull();
    expect(stats.followUpHint).toBeNull();
    expect(stats.buckets).toHaveLength(5);
    expect(stats.buckets.every((b) => b.count === 0)).toBe(true);
  });

  it("berechnet Durchschnitt, Median, Extremwerte und P90", () => {
    const stats = computeResponseTimeStats([2, 4, 6, 8, 10, 12, 14, 16, 18, 40].map((d) => app(d)));
    expect(stats.sampleSize).toBe(10);
    expect(stats.avgDays).toBe(13); // 130 / 10
    expect(stats.medianDays).toBe(11); // (10 + 12) / 2
    expect(stats.fastestDays).toBe(2);
    expect(stats.slowestDays).toBe(40);
    expect(stats.p90Days).toBe(18); // Nearest-Rank: 9. von 10
  });

  it("ordnet die Dauer den richtigen Zeitfenstern zu und die Prozente summieren sich auf ~100", () => {
    const stats = computeResponseTimeStats([0, 3, 4, 7, 8, 14, 15, 30, 31, 90].map((d) => app(d)));
    expect(stats.buckets.map((b) => b.count)).toEqual([2, 2, 2, 2, 2]);
    expect(stats.buckets.every((b) => b.pct === 20)).toBe(true);
  });

  it("schlüsselt nach Quelle auf, verlangt Mindestanzahl und sortiert nach schnellster Antwort", () => {
    const stats = computeResponseTimeStats([
      app(10, { source: "SLOW" }),
      app(20, { source: "SLOW" }),
      app(2, { source: "FAST" }),
      app(4, { source: "FAST" }),
      app(1, { source: "EINZELN" }),
      app(6),
      app(8),
    ]);
    expect(stats.bySource.map((s) => s.source)).toEqual(["FAST", "UNKNOWN", "SLOW"]);
    expect(stats.bySource[0]).toEqual({ source: "FAST", count: 2, avgDays: 3, medianDays: 3 });
    expect(stats.bySource.find((s) => s.source === "EINZELN")).toBeUndefined();
  });

  it("gibt den Nachfass-Hinweis erst ab 5 Antworten aus", () => {
    expect(computeResponseTimeStats([1, 2, 3, 4].map((d) => app(d))).followUpHint).toBeNull();
    const hint = computeResponseTimeStats([1, 2, 3, 4, 5].map((d) => app(d))).followUpHint;
    expect(hint).toContain("5 Tagen");
  });

  it("verwendet im Hinweis die Einzahl bei genau einem Tag", () => {
    const hint = computeResponseTimeStats([1, 1, 1, 1, 1].map((d) => app(d))).followUpHint;
    expect(hint).toContain("1 Tag ");
  });
});
