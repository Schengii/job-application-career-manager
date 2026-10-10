"use client";

import { Clock, Calendar, Zap, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TimingAnalyticsResult,
  TIME_SLOT_CONFIG,
  TimeSlot,
} from "@/lib/analytics/responseHeatmap";

interface ResponseHeatmapCardProps {
  timingData?: TimingAnalyticsResult;
}

export function ResponseHeatmapCard({ timingData }: ResponseHeatmapCardProps) {
  if (!timingData || timingData.totalAnalyzed === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Bewerbungs-Timing & Response-Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Noch keine ausreichenden Bewerbungszeitpunkte erfasst. Sobald du Bewerbungen verschickst, wird hier visualisiert, an welchen Wochentagen und Uhrzeiten du die höchste Interviewquote erzielst.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { dayStats, slotStats, heatmapGrid, bestDay, bestSlot, recommendation } = timingData;

  const slots: TimeSlot[] = ["MORNING", "MIDDAY", "AFTERNOON", "EVENING"];

  return (
    <Card className="border-border animate-fade-in">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Bewerbungs-Timing & Response-Heatmap
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analyse optimaler Absendezeiten für maximale Öffnungs- & Einladungsraten.
          </p>
        </div>
        {bestDay && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Zap className="h-3.5 w-3.5" /> Optimal: {bestDay} {bestSlot ? `• ${bestSlot}` : ""}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recommendation banner */}
        <div className="rounded-lg border border-primary/20 bg-primary-soft/30 p-3.5 text-xs text-foreground flex items-start gap-2.5">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-primary">Timing-Empfehlung: </span>
            {recommendation}
          </div>
        </div>

        {/* Heatmap Grid (Tage x Zeitslots) */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Wochentag- & Tageszeit-Verteilung (Anzahl & Einladungen)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-2 px-3">Wochentag</th>
                  {slots.map((s) => (
                    <th key={s} className="font-medium text-muted-foreground py-2 px-2">
                      <span className="inline-block mr-1">{TIME_SLOT_CONFIG[s].icon}</span>
                      {TIME_SLOT_CONFIG[s].label}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {TIME_SLOT_CONFIG[s].hours}
                      </span>
                    </th>
                  ))}
                  <th className="font-semibold text-foreground py-2 px-3">Interview-Quote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dayStats.map((d) => {
                  return (
                    <tr key={d.dayIndex} className="hover:bg-surface-hover transition-colors">
                      <td className="text-left font-medium text-foreground py-2.5 px-3">
                        {d.dayName}
                        <span className="block text-[10px] text-muted-foreground">
                          {d.totalApplications} {d.totalApplications === 1 ? "Bewerbung" : "Bewerbungen"}
                        </span>
                      </td>

                      {slots.map((slot) => {
                        const cell = heatmapGrid.find(
                          (c) => c.dayIndex === d.dayIndex && c.slot === slot
                        );
                        const count = cell?.total || 0;
                        const interviews = cell?.interviews || 0;
                        const hasInterviews = interviews > 0;

                        return (
                          <td key={slot} className="py-2.5 px-2">
                            {count > 0 ? (
                              <div
                                className={`mx-auto flex flex-col items-center justify-center rounded-md p-1.5 transition-colors ${
                                  hasInterviews
                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30"
                                    : "bg-surface border border-border text-foreground"
                                }`}
                              >
                                <span className="text-xs">{count}</span>
                                {hasInterviews && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                    ★ {interviews}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              d.interviewRate >= 50
                                ? "text-emerald-600 dark:text-emerald-400"
                                : d.interviewRate > 0
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            {d.totalApplications > 0 ? `${d.interviewRate}%` : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tageszeiten-Zusammenfassung */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {slotStats.map((slot) => (
            <div
              key={slot.slot}
              className="p-3 rounded-lg border border-border bg-surface text-center space-y-1"
            >
              <div className="text-xl">{slot.icon}</div>
              <div className="text-xs font-semibold text-foreground">{slot.label}</div>
              <div className="text-[10px] text-muted-foreground">{slot.hours}</div>
              <div className="pt-1 text-xs">
                <span className="font-bold text-foreground">{slot.totalApplications}</span>{" "}
                <span className="text-muted-foreground">gesendet</span>
              </div>
              <div className="text-[11px] font-semibold text-primary">
                {slot.totalApplications > 0 ? `${slot.interviewRate}% Quote` : "Keine Daten"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
