"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { TrendingUp, Clock, Target, Send, Filter, Sparkles } from "lucide-react";
import { fetcher, apiPost } from "@/lib/core/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { StatusBarChart } from "@/components/analytics/status-bar-chart";
import { PortalBarChart } from "@/components/analytics/portal-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { StatTile } from "@/components/analytics/stat-tile";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { SalaryBenchmarkCard } from "@/components/analytics/salary-benchmark-card";
import { RejectionReasonsChart } from "@/components/analytics/rejection-reasons-chart";
import { SkillSuccessRatesCard, type SkillSuccessRate } from "@/components/analytics/skill-success-rates-card";
import { SkillGapCard } from "@/components/analytics/skill-gap-card";
import { ToneEfficiencyCard } from "@/components/analytics/tone-efficiency-card";
import { SalaryHistoryCard } from "@/components/analytics/salary-history-card";
import { ResponseHeatmapCard } from "@/components/analytics/response-heatmap-card";

const CardSkeleton = () => <Card className="h-64 animate-pulse bg-muted/40" />;

const OfferComparisonMatrix = dynamic(
  () => import("@/components/analytics/offer-comparison-matrix").then((m) => m.OfferComparisonMatrix),
  { loading: CardSkeleton, ssr: false }
);
const TotalCompensationCard = dynamic(
  () => import("@/components/analytics/total-compensation-card").then((m) => m.TotalCompensationCard),
  { loading: CardSkeleton, ssr: false }
);
const RoiTrackerCard = dynamic(
  () => import("@/components/analytics/roi-tracker-card").then((m) => m.RoiTrackerCard),
  { loading: CardSkeleton, ssr: false }
);
const CurrencyRelocationCalculator = dynamic(
  () => import("@/components/analytics/currency-relocation-calculator").then((m) => m.CurrencyRelocationCalculator),
  { loading: CardSkeleton, ssr: false }
);
const SkillRoadmapTracker = dynamic(
  () => import("@/components/analytics/skill-roadmap-tracker").then((m) => m.SkillRoadmapTracker),
  { loading: CardSkeleton, ssr: false }
);
const VermittlungsbudgetCard = dynamic(
  () => import("@/components/analytics/vermittlungsbudget-card").then((m) => m.VermittlungsbudgetCard),
  { loading: CardSkeleton, ssr: false }
);
const ContractCheckerCard = dynamic(
  () => import("@/components/analytics/contract-checker-card").then((m) => m.ContractCheckerCard),
  { loading: CardSkeleton, ssr: false }
);
const NoticePeriodCalculatorCard = dynamic(
  () => import("@/components/analytics/notice-period-calculator-card").then((m) => m.NoticePeriodCalculatorCard),
  { loading: CardSkeleton, ssr: false }
);
const CommuteCalculatorCard = dynamic(
  () => import("@/components/analytics/commute-calculator-card").then((m) => m.CommuteCalculatorCard),
  { loading: CardSkeleton, ssr: false }
);
const TaxExpenseReportCard = dynamic(
  () => import("@/components/analytics/tax-expense-report-card").then((m) => m.TaxExpenseReportCard),
  { loading: CardSkeleton, ssr: false }
);
const CounterOfferAssistantCard = dynamic(
  () => import("@/components/analytics/counter-offer-assistant-card").then((m) => m.CounterOfferAssistantCard),
  { loading: CardSkeleton, ssr: false }
);
import type { ToneSuccessRate } from "@/lib/applications/toneSuccessRates";
import type { SalaryDataPoint } from "@/lib/salary/salaryHistoryTracker";
import type { TimingAnalyticsResult } from "@/lib/analytics/responseHeatmap";

type Analytics = {
  statusDistribution: { status: string; label: string; color: string; count: number }[];
  portalDistribution: { portal: string; label: string; count: number; interviewCount?: number; interviewRate?: number }[];
  monthlySeries: { label: string; count: number }[];
  rejectionDistribution?: { reason: string; count: number; pct: number }[];
  funnel?: { stage: string; count: number; rate: number }[];
  tagSuccessRates?: SkillSuccessRate[];
  techStackSuccessRates?: SkillSuccessRate[];
  toneSuccessRates?: ToneSuccessRate[];
  salaryTrends?: SalaryDataPoint[];
  timingAnalytics?: TimingAnalyticsResult;
  successRate: number | null;
  avgResponseDays: number | null;
  totalApplications: number;
  respondedCount: number;
  rejectedCount?: number;
};

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<Analytics>("/api/analytics", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  async function handleGenerateSamples() {
    setGenerating(true);
    try {
      await apiPost("/api/applications/simulate-batch", {});
      await Promise.all([
        mutate("/api/analytics"),
        mutate("/api/applications"),
        mutate("/api/metrics"),
        mutate("/api/companies"),
      ]);
      toast.success("6 Beispiel-Bewerbungen für Statistiken angelegt!");
    } catch {
      toast.error("Generierung fehlgeschlagen.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Auswertungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kennzahlen zu deiner Jobsuche: Erfolgsquote, Conversion-Trichter, Reaktionszeiten und Portal-Effizienz.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateSamples}
          disabled={generating}
          className="card-hover-effect"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          {generating ? "Generiere …" : "Test-Bewerbungen füllen"}
        </Button>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Auswertungen …</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label="Bewerbungen gesamt"
              value={data.totalApplications}
              icon={Send}
            />
            <StatTile
              label="Erfolgsquote"
              value={data.successRate ?? "—"}
              suffix={data.successRate !== null ? "%" : undefined}
              hint="Zusagen ÷ (Zusagen + Absagen)"
              icon={Target}
            />
            <StatTile
              label="⌀ Reaktionszeit"
              value={data.avgResponseDays ?? "—"}
              suffix={data.avgResponseDays !== null ? "Tage" : undefined}
              hint={`Basis: ${data.respondedCount} Bewerbung(en) mit Rückmeldung`}
              icon={Clock}
            />
            <StatTile
              label="Trend (6 Monate)"
              value={data.monthlySeries.reduce((sum, m) => sum + m.count, 0)}
              hint="Neue Bewerbungen seit 6 Monaten"
              icon={TrendingUp}
            />
          </div>

          <VermittlungsbudgetCard />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            {data.funnel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" /> Bewerbungs-Trichter (Conversion Funnel)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <FunnelChart data={data.funnel} />
                </CardContent>
              </Card>
            )}

            {/* Bewerbungen pro Monat */}
            <Card>
              <CardHeader>
                <CardTitle>Bewerbungen pro Monat</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <TrendChart data={data.monthlySeries} />
              </CardContent>
            </Card>

            {/* Status Verteilung */}
            <Card>
              <CardHeader>
                <CardTitle>Status-Verteilung</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <StatusBarChart data={data.statusDistribution} />
              </CardContent>
            </Card>

            {/* Absagegründe Analyse */}
            <Card>
              <CardHeader>
                <CardTitle>Absagegründe & Feedback-Analyse</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RejectionReasonsChart data={data.rejectionDistribution ?? []} />
              </CardContent>
            </Card>

            {/* Portal Verteilung */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Bewerbungen je Jobportal</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <PortalBarChart data={data.portalDistribution} />
              </CardContent>
            </Card>

            {/* Portal Effizienz-Tabelle */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Portal-Effizienz & Einladungsquoten</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="scroll-thin overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-hover/60 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Jobportal / Quelle</th>
                        <th className="px-4 py-2.5 font-medium">Bewerbungen</th>
                        <th className="px-4 py-2.5 font-medium">Gespräche / Angebote</th>
                        <th className="px-4 py-2.5 font-medium">Einladungsquote</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.portalDistribution.map((p) => (
                        <tr key={p.portal} className="hover:bg-surface-hover/50">
                          <td className="px-4 py-2.5 font-medium text-foreground">{p.label}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{p.count}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{p.interviewCount ?? 0}</td>
                          <td className="px-4 py-2.5 font-semibold text-primary">
                            {p.interviewRate ?? 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            {/* Bewerbungs-Timing & Response-Heatmap */}
            <div className="lg:col-span-2">
              <ResponseHeatmapCard timingData={data.timingAnalytics} />
            </div>

            {/* Markt-Nachfrage & Skill-Gap Matrix */}
            <div className="lg:col-span-2">
              <SkillGapCard />
            </div>

            {/* Erfolgsquote nach Tag & Tech-Stack */}
            <SkillSuccessRatesCard
              tagData={data.tagSuccessRates ?? []}
              techStackData={data.tagSuccessRates ?? []}
            />

            {/* Anschreiben-Tonalität & Stil-Effizienz */}
            {data.toneSuccessRates && data.toneSuccessRates.length > 0 && (
              <div className="lg:col-span-2">
                <ToneEfficiencyCard data={data.toneSuccessRates} />
              </div>
            )}

            {/* Gehalts-Benchmarking & Marktvergleich */}
            <div className="lg:col-span-2">
              <SalaryBenchmarkCard />
            </div>

            {/* Historischer Gehaltstrend & Entwicklung */}
            <div className="lg:col-span-2">
              <SalaryHistoryCard salaryTrends={data.salaryTrends} />
            </div>

            {/* Gegenangebots- & Nachverhandlungs-Assistent */}
            <div className="lg:col-span-2">
              <CounterOfferAssistantCard />
            </div>

            {/* Total Compensation & Benefit-Rechner */}
            <div className="lg:col-span-2">
              <TotalCompensationCard />
            </div>

            {/* Bewerbungs-Aufwand & ROI-Tracker */}
            <div className="lg:col-span-2">
              <RoiTrackerCard />
            </div>

            {/* Persönliche Skill- & Lernziel-Roadmap */}
            <div className="lg:col-span-2">
              <SkillRoadmapTracker />
            </div>

            {/* Arbeitsvertrags- & Klausel-Checker */}
            <div className="lg:col-span-2">
              <ContractCheckerCard />
            </div>

            {/* Kündigungsfristen- & Eintrittstermin-Rechner */}
            <div className="lg:col-span-2">
              <NoticePeriodCalculatorCard />
            </div>

            {/* Multi-Währungs- & Relocation-Rechner */}
            <div className="lg:col-span-2">
              <CurrencyRelocationCalculator />
            </div>

            {/* Pendelzeit-, Fahrtkosten- & Remote-Netto-Rechner */}
            <div className="lg:col-span-2">
              <CommuteCalculatorCard />
            </div>

            {/* Steuerbericht & Bewerbungskosten */}
            <div className="lg:col-span-2">
              <TaxExpenseReportCard />
            </div>

            {/* Gehalts- & Benefit-Vergleichsmatrix */}
            <div className="lg:col-span-2">
              <OfferComparisonMatrix />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
