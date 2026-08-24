"use client";

import useSWR from "swr";
import { TrendingUp, Clock, Target, Send, Filter } from "lucide-react";
import { fetcher } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBarChart } from "@/components/analytics/status-bar-chart";
import { PortalBarChart } from "@/components/analytics/portal-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { StatTile } from "@/components/analytics/stat-tile";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { OfferComparisonMatrix } from "@/components/analytics/offer-comparison-matrix";

type Analytics = {
  statusDistribution: { status: string; label: string; color: string; count: number }[];
  portalDistribution: { portal: string; label: string; count: number; interviewCount?: number; interviewRate?: number }[];
  monthlySeries: { label: string; count: number }[];
  funnel?: { stage: string; count: number; rate: number }[];
  successRate: number | null;
  avgResponseDays: number | null;
  totalApplications: number;
  respondedCount: number;
};

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<Analytics>("/api/analytics", fetcher);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Auswertungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kennzahlen zu deiner Jobsuche: Erfolgsquote, Conversion-Trichter, Reaktionszeiten und Portal-Effizienz.
        </p>
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

            {/* Portal Verteilung */}
            <Card>
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
