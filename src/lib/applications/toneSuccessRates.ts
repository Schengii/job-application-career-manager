// -----------------------------------------------------------------------------
// Erfolgsquoten nach Anschreiben-Tonalität
// -----------------------------------------------------------------------------
// Analysiert, welcher Anschreiben-Stil (MODERN, CLASSIC, STARTUP, DETAILED)
// die höchste Einladungs- und Zusagequote erzielt.
// -----------------------------------------------------------------------------
import { COVER_LETTER_TONES } from "@/lib/core/constants";

export interface ToneSuccessRate {
  tone: string;
  label: string;
  total: number;
  interviewCount: number;
  interviewRate: number;
  offerCount: number;
  offerRate: number;
}

export interface ApplicationWithCompanyTone {
  status: string;
  statusEvents: { status: string }[];
  company: {
    preferredTone?: string | null;
  };
}

export function computeToneSuccessRates(
  applications: ApplicationWithCompanyTone[]
): ToneSuccessRate[] {
  const stats = new Map<string, { total: number; interview: number; offer: number }>();

  // Initialisiere alle bekannten Töne
  for (const t of COVER_LETTER_TONES) {
    stats.set(t.value, { total: 0, interview: 0, offer: 0 });
  }
  stats.set("DEFAULT", { total: 0, interview: 0, offer: 0 });

  for (const app of applications) {
    const tone = app.company?.preferredTone || "DEFAULT";
    const current = stats.get(tone) || { total: 0, interview: 0, offer: 0 };

    current.total += 1;
    const reachedInterview =
      app.status === "INTERVIEW" ||
      app.status === "OFFER" ||
      app.statusEvents.some((e) => e.status === "INTERVIEW");

    if (reachedInterview) current.interview += 1;
    if (app.status === "OFFER") current.offer += 1;

    stats.set(tone, current);
  }

  const toneLabelMap: Record<string, string> = {
    MODERN: "Modern (Lösungsorientiert)",
    CLASSIC: "Klassisch (Formell/Konzern)",
    STARTUP: "Startup / Agil (Dynamisch)",
    DETAILED: "Detailliert (Umschulung & Tech)",
    DEFAULT: "Standard / Nicht festgelegt",
  };

  return Array.from(stats.entries())
    .map(([tone, s]) => ({
      tone,
      label: toneLabelMap[tone] || tone,
      total: s.total,
      interviewCount: s.interview,
      interviewRate: s.total > 0 ? Math.round((s.interview / s.total) * 100) : 0,
      offerCount: s.offer,
      offerRate: s.total > 0 ? Math.round((s.offer / s.total) * 100) : 0,
    }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total);
}
