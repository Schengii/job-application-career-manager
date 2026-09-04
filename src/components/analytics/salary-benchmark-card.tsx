"use client";

// -----------------------------------------------------------------------------
// Gehalts-Benchmarking & Marktvergleich Card Komponente
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import useSWR from "swr";
import { TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import {
  calculateSalaryBenchmark,
  type ExperienceLevel,
  type Region,
} from "@/lib/salary/salaryBenchmark";
import { fetcher } from "@/lib/core/api";
import type { Preferences } from "@/types";

export function SalaryBenchmarkCard() {
  const { data: preferences } = useSWR<Preferences>("/api/preferences", fetcher);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("JUNIOR_ENTRY");
  const [region, setRegion] = useState<Region>("NRW_BONN_KOELN");

  const userMinSalary = preferences?.minSalary ? Number(preferences.minSalary) : 48000;

  const benchmark = useMemo(() => {
    return calculateSalaryBenchmark(experienceLevel, region, userMinSalary);
  }, [experienceLevel, region, userMinSalary]);

  const maxVal = Math.max(benchmark.p90, userMinSalary, 90000);

  return (
    <Card className="glass-card animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Gehalts-Benchmarking & Marktvergleich
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Marktübliche Gehälter für Fachinformatiker Anwendungsentwicklung (Frontend)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
            className="h-8 w-auto text-xs"
          >
            <option value="JUNIOR_ENTRY">Junior (0–2 Jahre / Umschulung)</option>
            <option value="MID_LEVEL">Mid-Level (2–5 Jahre)</option>
            <option value="SENIOR">Senior (5+ Jahre)</option>
          </Select>

          <Select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="h-8 w-auto text-xs"
          >
            <option value="NRW_BONN_KOELN">NRW (Bonn / Köln / DUS)</option>
            <option value="NRW_RUHRGEBIET">NRW (Dortmund / Ruhrgebiet)</option>
            <option value="REMOTE">Remote (Bundesweit)</option>
            <option value="BERLIN">Berlin</option>
            <option value="MUENCHEN">München</option>
            <option value="DEUTSCHLAND_SCHNITT">Deutschland Schnitt</option>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-6">
        {/* Gehaltsbalken & Perzentile */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-3 text-center shadow-2xs">
            <p className="text-[11px] text-muted-foreground">25. Perzentil (Einstieg)</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {benchmark.p25.toLocaleString("de-DE")} €
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center shadow-2xs">
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Median (50. Perzentil)
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {benchmark.median.toLocaleString("de-DE")} €
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 text-center shadow-2xs">
            <p className="text-[11px] text-muted-foreground">75. Perzentil (Top-Leister)</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {benchmark.p75.toLocaleString("de-DE")} €
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 text-center shadow-2xs">
            <p className="text-[11px] text-muted-foreground">90. Perzentil (Spitzenfeld)</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {benchmark.p90.toLocaleString("de-DE")} €
            </p>
          </div>
        </div>

        {/* Vergleichs-Balkendiagramm */}
        <div className="space-y-3 rounded-xl border border-border bg-surface-hover/30 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Deine Gehaltsvorstellung vs. Marktmedian</span>
            {benchmark.userTargetVsMedianPercent !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  benchmark.userTargetVsMedianPercent >= 0
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-amber-500/15 text-amber-600"
                }`}
              >
                {benchmark.userTargetVsMedianPercent >= 0 ? "+" : ""}
                {benchmark.userTargetVsMedianPercent}% ggü. Median
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Dein Wunschgehalt (Profil)</span>
                <span className="font-semibold text-foreground">
                  {userMinSalary.toLocaleString("de-DE")} € / Jahr
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-surface-hover overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 shadow-2xs"
                  style={{ width: `${Math.min(100, Math.round((userMinSalary / maxVal) * 100))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Markt-Median ({benchmark.regionLabel})</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {benchmark.median.toLocaleString("de-DE")} € / Jahr
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-surface-hover overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500 shadow-2xs"
                  style={{ width: `${Math.min(100, Math.round((benchmark.median / maxVal) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Verhandlungstipps */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Verhandlungs-Hebel & Argumente für Vorstellungsgespräche
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {benchmark.negotiationTips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border bg-surface p-2.5 text-xs text-muted-foreground"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
