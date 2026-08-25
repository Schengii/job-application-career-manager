"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Clock, TrendingUp, Zap, AlertCircle, CheckCircle2, Hourglass } from "lucide-react";
import { fetcher } from "@/lib/api";
import { ApplicationListItem } from "@/types";
import { calculateRoiAnalytics } from "@/lib/roiAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RoiTrackerCard() {
  const { data: applications, isLoading } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);

  const roi = useMemo(() => {
    return calculateRoiAnalytics(applications || []);
  }, [applications]);

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-sm text-muted-foreground">Lade Zeit- & ROI-Metriken …</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Hourglass className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Bewerbungs-Aufwand & ROI-Tracker (Return on Time Invested)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Zeiteffizienz & Kanal-Ertrag: Wie viele Vorstellungsgespräche erzielst du pro investierter Stunde?
              </p>
            </div>
          </div>
          <Badge color="blue" className="text-xs font-semibold">
            {roi.totalTimeInvestedHours} Std. Gesamtaufwand
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPI Kacheln */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-3.5">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Ø Aufwand / Bewerbung
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{roi.avgMinutesPerApplication}</span>
              <span className="text-xs text-muted-foreground">Minuten</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-success" /> Höchster Ertrag (Top-Kanal)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold text-success truncate">{roi.topPerformingChannel || "Noch offen"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Erfasste Bewerbungen
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{applications?.length || 0}</span>
              <span className="text-xs text-muted-foreground">Bewerbungen</span>
            </div>
          </div>
        </div>

        {/* Kanal-Effizienz Tabelle */}
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-hover/60 uppercase text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2.5 font-medium">Jobportal / Quelle</th>
                <th className="px-3.5 py-2.5 font-medium">Bewerbungen</th>
                <th className="px-3.5 py-2.5 font-medium">Zeitaufwand</th>
                <th className="px-3.5 py-2.5 font-medium">Gespräche</th>
                <th className="px-3.5 py-2.5 font-medium">Einladungsquote</th>
                <th className="px-3.5 py-2.5 font-medium">ROTI-Score (Ertrag/10h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roi.channelMetrics.map((c) => (
                <tr key={c.channel} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-semibold text-foreground">{c.channel}</td>
                  <td className="px-3.5 py-2.5 text-muted-foreground">{c.totalApplications}</td>
                  <td className="px-3.5 py-2.5 text-muted-foreground">{c.totalTimeHours} h ({c.totalTimeMinutes} min)</td>
                  <td className="px-3.5 py-2.5 font-medium text-foreground">{c.interviewsCount}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-primary">{c.interviewRate}%</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      c.rotiScore >= 5
                        ? "bg-success/15 text-success"
                        : c.rotiScore > 0
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {c.rotiScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Strategische Tipps */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" /> Strategische Zeitmanagement-Empfehlungen:
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {roi.strategicTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
