// -----------------------------------------------------------------------------
// Bewerbungstrichter-Benchmarking & KI-Erfolgsdiagnose
// -----------------------------------------------------------------------------
// Berechnet Conversion-Raten über alle Bewerbungsphasen, vergleicht sie mit
// Branchen-Benchmarks für Frontend-/Fullstack-Entwickler und liefert
// datengestützte Handlungsempfehlungen.
// -----------------------------------------------------------------------------

export type FunnelMetrics = {
  total: number;
  draft: number;
  sent: number;
  interview: number;
  offer: number;
  rejected: number;
};

export type FunnelBenchmarkStage = {
  stage: string;
  count: number;
  actualRate: number; // in %
  industryBenchmarkRate: number; // in %
  status: "ABOVE_BENCHMARK" | "AVERAGE" | "BELOW_BENCHMARK";
};

export type FunnelInsight = {
  id: string;
  type: "POSITIVE" | "WARNING" | "INFO";
  title: string;
  description: string;
  actionRecommendation: string;
};

export type FunnelDiagnosticsResult = {
  stages: FunnelBenchmarkStage[];
  pipelineHealthScore: number; // 0-100%
  healthRating: "TOP_TIER" | "HEALTHY" | "NEEDS_OPTIMIZATION" | "INSUFFICIENT_DATA";
  sentToInterviewRate: number;
  interviewToOfferRate: number;
  insights: FunnelInsight[];
};

export const INDUSTRY_BENCHMARKS = {
  sentToInterview: 25, // 25% der versendeten Bewerbungen führen zu Gesprächen
  interviewToOffer: 30, // 30% der Interviews führen zu Angeboten
  overallOfferRate: 8, // ca. 8% Gesamt-Erfolgsquote
};

export function analyzeFunnelDiagnostics(metrics: FunnelMetrics): FunnelDiagnosticsResult {
  const sentOrHigher = metrics.sent + metrics.interview + metrics.offer + metrics.rejected;
  const interviewOrHigher = metrics.interview + metrics.offer;
  const offerCount = metrics.offer;

  const sentToInterviewRate = sentOrHigher > 0
    ? Math.round((interviewOrHigher / sentOrHigher) * 100)
    : 0;

  const interviewToOfferRate = interviewOrHigher > 0
    ? Math.round((offerCount / interviewOrHigher) * 100)
    : 0;

  const stages: FunnelBenchmarkStage[] = [
    {
      stage: "Bewerbung versendet",
      count: sentOrHigher,
      actualRate: 100,
      industryBenchmarkRate: 100,
      status: "AVERAGE",
    },
    {
      stage: "Interview / Tech-Challenge",
      count: interviewOrHigher,
      actualRate: sentToInterviewRate,
      industryBenchmarkRate: INDUSTRY_BENCHMARKS.sentToInterview,
      status:
        sentToInterviewRate >= INDUSTRY_BENCHMARKS.sentToInterview + 5
          ? "ABOVE_BENCHMARK"
          : sentToInterviewRate <= INDUSTRY_BENCHMARKS.sentToInterview - 8
          ? "BELOW_BENCHMARK"
          : "AVERAGE",
    },
    {
      stage: "Job-Angebot (Offer)",
      count: offerCount,
      actualRate: sentOrHigher > 0 ? Math.round((offerCount / sentOrHigher) * 100) : 0,
      industryBenchmarkRate: INDUSTRY_BENCHMARKS.overallOfferRate,
      status:
        offerCount > 0 && sentOrHigher > 0 && Math.round((offerCount / sentOrHigher) * 100) >= INDUSTRY_BENCHMARKS.overallOfferRate
          ? "ABOVE_BENCHMARK"
          : "AVERAGE",
    },
  ];

  const insights: FunnelInsight[] = [];

  if (sentOrHigher < 3) {
    return {
      stages,
      pipelineHealthScore: 70,
      healthRating: "INSUFFICIENT_DATA",
      sentToInterviewRate,
      interviewToOfferRate,
      insights: [
        {
          id: "data-notice",
          type: "INFO",
          title: "Pipeline im Aufbau",
          description: "Du hast aktuell noch wenige versendete Bewerbungen erfasst.",
          actionRecommendation: "Versende mindestens 5–10 Bewerbungen, um statistisch aussagekräftige Funnel-Kennzahlen zu erhalten.",
        },
      ],
    };
  }

  // Diagnose 1: Erste Stufe (Sent -> Interview)
  if (sentToInterviewRate >= 30) {
    insights.push({
      id: "strong-resume",
      type: "POSITIVE",
      title: "Hervorragende Rücklaufquote (Interview-Einladungen)",
      description: `Deine Einladungsquote liegt mit ${sentToInterviewRate}% deutlich über dem Marktdurchschnitt (~${INDUSTRY_BENCHMARKS.sentToInterview}%).`,
      actionRecommendation: "Deine Unterlagen (CV & Anschreiben) überzeugen Recruiter. Halte diese Qualität bei!",
    });
  } else if (sentToInterviewRate < 15) {
    insights.push({
      id: "weak-resume",
      type: "WARNING",
      title: "Einladungsquote unter Marktdurchschnitt",
      description: `Mit ${sentToInterviewRate}% liegt die Quote unter dem Branchendurchschnitt von ~${INDUSTRY_BENCHMARKS.sentToInterview}%.`,
      actionRecommendation: "Optimiere deine ATS-Kompatibilität im CV-Designer und nutze den neuen KI Requirement-Booster im Anschreiben.",
    });
  }

  // Diagnose 2: Zweite Stufe (Interview -> Offer)
  if (interviewOrHigher >= 2 && interviewToOfferRate >= 35) {
    insights.push({
      id: "strong-closer",
      type: "POSITIVE",
      title: "Hohe Abschlussstärke in Fachgesprächen",
      description: `Mit ${interviewToOfferRate}% wandelst du einen sehr hohen Anteil an Gesprächen in konkrete Angebote um.`,
      actionRecommendation: "Bereite dich mit dem Gehaltsverhandlungs-Coach optimal auf das Closing vor.",
    });
  } else if (interviewOrHigher >= 3 && interviewToOfferRate === 0) {
    insights.push({
      id: "interview-gap",
      type: "WARNING",
      title: "Optimierungspotenzial in Fachgesprächen",
      description: "Du wirst regelmäßig eingeladen, der Schritt zum finalen Angebot fehlt jedoch noch.",
      actionRecommendation: "Trainiere im neuen Tech-Quiz Simulator (React 19 / TS) und teste den Audio Voice-Simulator.",
    });
  }

  // Gesamt-Score berechnen (0-100)
  let healthScore = Math.min(100, Math.round(sentToInterviewRate * 1.5 + interviewToOfferRate * 1.0 + (offerCount > 0 ? 20 : 0)));
  healthScore = Math.max(20, healthScore);

  let healthRating: FunnelDiagnosticsResult["healthRating"] = "HEALTHY";
  if (healthScore >= 80) healthRating = "TOP_TIER";
  else if (healthScore < 50) healthRating = "NEEDS_OPTIMIZATION";

  return {
    stages,
    pipelineHealthScore: healthScore,
    healthRating,
    sentToInterviewRate,
    interviewToOfferRate,
    insights,
  };
}
