"use client";

import { TrendingUp, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalaryDataPoint } from "@/lib/salary/salaryHistoryTracker";

interface SalaryHistoryCardProps {
  salaryTrends?: SalaryDataPoint[];
}

export function SalaryHistoryCard({ salaryTrends }: SalaryHistoryCardProps) {
  if (!salaryTrends || salaryTrends.length === 0) {
    return null;
  }

  const hasData = salaryTrends.some((m) => m.count > 0);
  const maxAvg = Math.max(...salaryTrends.map((m) => m.averageSalary), 60000);

  // Overall statistics
  const totalOffersWithSalary = salaryTrends.reduce((acc, m) => acc + m.count, 0);
  const totalSum = salaryTrends.reduce((acc, m) => acc + (m.averageSalary * m.count), 0);
  const overallAvg = totalOffersWithSalary > 0 ? Math.round(totalSum / totalOffersWithSalary) : 0;

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Gehaltshistorie & Markttrend (Letzte 6 Monate)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Entwicklung der gebotenen Gehälter aus deinen Bewerbungen und Stellenangeboten
            </p>
          </div>
          {overallAvg > 0 && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Durchschnitt</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {overallAvg.toLocaleString("de-DE")} €
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            Noch keine Gehaltsangaben in den letzten 6 Monaten erfasst. Hinterlege Ziel- oder Angebotsgehälter bei deinen Bewerbungen.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Bar Chart */}
            <div className="grid grid-cols-6 gap-2 items-end h-40 pt-4 pb-2 border-b border-border/40">
              {salaryTrends.map((m, idx) => {
                const heightPct = m.averageSalary > 0 ? Math.max(15, Math.round((m.averageSalary / maxAvg) * 100)) : 4;
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-popover text-popover-foreground text-[11px] rounded px-2 py-1 shadow pointer-events-none whitespace-nowrap z-10 border border-border">
                      {m.averageSalary > 0
                        ? `${m.averageSalary.toLocaleString("de-DE")} € (${m.count} ${m.count === 1 ? "Job" : "Jobs"})`
                        : "Keine Daten"}
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                        m.averageSalary > 0
                          ? "bg-gradient-to-t from-emerald-600 to-teal-400 dark:from-emerald-700 dark:to-teal-500 shadow-sm"
                          : "bg-muted/40"
                      }`}
                    />
                    <span className="text-[11px] text-muted-foreground font-medium mt-2">
                      {m.monthLabel}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {m.averageSalary > 0 ? `${Math.round(m.averageSalary / 1000)}k` : "-"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="rounded-lg bg-surface-hover/30 p-2 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Erfasste Jobs</span>
                <span className="text-sm font-semibold text-foreground">{totalOffersWithSalary}</span>
              </div>
              <div className="rounded-lg bg-surface-hover/30 p-2 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Min. Gehalt</span>
                <span className="text-sm font-semibold text-foreground">
                  {Math.min(...salaryTrends.filter((m) => m.minSalary > 0).map((m) => m.minSalary), 0) > 0
                    ? `${Math.min(...salaryTrends.filter((m) => m.minSalary > 0).map((m) => m.minSalary)).toLocaleString("de-DE")} €`
                    : "-"}
                </span>
              </div>
              <div className="rounded-lg bg-surface-hover/30 p-2 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Max. Gehalt</span>
                <span className="text-sm font-semibold text-foreground">
                  {Math.max(...salaryTrends.map((m) => m.maxSalary), 0) > 0
                    ? `${Math.max(...salaryTrends.map((m) => m.maxSalary)).toLocaleString("de-DE")} €`
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
