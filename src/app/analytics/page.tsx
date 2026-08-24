"use client";

import useSWR from "swr";
import { TrendingUp, Clock, Target, Send } from "lucide-react";
import { fetcher } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBarChart } from "@/components/analytics/status-bar-chart";
import { PortalBarChart } from "@/components/analytics/portal-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { StatTile } from "@/components/analytics/stat-tile";

type Analytics = {
  statusDistribution: { status: string; label: string; color: string; count: number }[];
  portalDistribution: { portal: string; label: string; count: number }[];
  monthlySeries: { label: string; count: number }[];
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
          Kennzahlen zu deiner Jobsuche: Erfolgsquote, Reaktionszeiten und Verteilung nach Status & Portal.
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
            <Card>
              <CardHeader>
                <CardTitle>Bewerbungen pro Monat</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <TrendChart data={data.monthlySeries} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status-Verteilung</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <StatusBarChart data={data.statusDistribution} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Bewerbungen je Jobportal</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <PortalBarChart data={data.portalDistribution} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
