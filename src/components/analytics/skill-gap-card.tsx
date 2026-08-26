"use client";

// -----------------------------------------------------------------------------
// Skill-Gap Matrix & Lern-Roadmap Component
// -----------------------------------------------------------------------------
import useSWR from "swr";
import { AlertCircle, CheckCircle2, BookOpen, Layers } from "lucide-react";
import { fetcher } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SkillGapAnalysisResult } from "@/lib/skillGapAnalyzer";

export function SkillGapCard() {
  const { data: analysis, isLoading } = useSWR<SkillGapAnalysisResult>(
    "/api/analytics/skill-gap",
    fetcher
  );

  if (isLoading) {
    return (
      <Card className="border-border bg-surface p-6 text-center text-sm text-muted-foreground">
        Analysiere Marktnachfrage & Skill-Gaps …
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" /> Markt-Nachfrage & Skill-Gap Matrix
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Abgleich deines Profils mit allen {analysis.totalJobsAnalyzed} analysierten Stellenangeboten
          </p>
        </div>
        <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          Marktabdeckung: {analysis.profileCoveragePercentage}%
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Top Demand Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Gefragte Technologien am Markt
            </h4>
            <div className="space-y-1.5">
              {analysis.topSkills.slice(0, 7).map((item) => (
                <div
                  key={item.skill}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-hover/30 p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.inUserProfile ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="font-semibold text-foreground">{item.skill}</span>
                    <span className="rounded bg-surface px-1.5 py-0.2 text-[10px] text-muted-foreground">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.marketDemandCount}x ({item.marketDemandPercentage}%)</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.inUserProfile
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {item.inUserProfile ? "Im Profil" : "Lernchance"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Learning Roadmap */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" /> Empfohlene Lern-Roadmap (Hebelwirkung)
            </h4>

            {analysis.highDemandMissing.length > 0 ? (
              <div className="space-y-2">
                {analysis.highDemandMissing.slice(0, 3).map((item) => (
                  <div
                    key={item.skill}
                    className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground text-sm">{item.skill}</span>
                      <span className="rounded bg-primary/20 text-primary font-bold px-2 py-0.5 text-[10px]">
                        Prio: {item.priority}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {item.learningRecommendation}
                    </p>
                    <p className="text-[11px] text-primary font-medium">
                      💡 Empfohlene Ressource: {item.resourceTip}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                🎉 Hervorragend! Dein Profil deckt alle Kerntechnologien der aktuellen Stellenangebote ab.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
