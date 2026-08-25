"use client";

// -----------------------------------------------------------------------------
// ATS Score & Resume Optimizer Card Component
// -----------------------------------------------------------------------------
import { useMemo } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Sparkles, FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { evaluateAtsCompatibility } from "@/lib/atsChecker";
import type { PreferencesWithProfile } from "@/types";

interface AtsScoreCardProps {
  preferences: PreferencesWithProfile;
  targetJobTechStack?: string | null;
}

export function AtsScoreCard({ preferences, targetJobTechStack }: AtsScoreCardProps) {
  const result = useMemo(() => {
    return evaluateAtsCompatibility({
      preferences,
      targetJobTechStack,
    });
  }, [preferences, targetJobTechStack]);

  const scoreColor =
    result.overallScore >= 85
      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : result.overallScore >= 70
      ? "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10"
      : "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10";

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" /> ATS-Kompatibilität & Parser-Check
        </CardTitle>
        <div className={`px-3 py-1 rounded-full border text-xs font-extrabold ${scoreColor}`}>
          Score: {result.overallScore}% ({result.rating})
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Breakdown Progress Bars */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Keyword-Match</span>
              <span className="font-semibold text-foreground">{result.breakdown.keywordMatch}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${result.breakdown.keywordMatch}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Vollständigkeit</span>
              <span className="font-semibold text-foreground">{result.breakdown.sectionCompleteness}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.breakdown.sectionCompleteness}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Kontaktdaten</span>
              <span className="font-semibold text-foreground">{result.breakdown.contactClarity}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${result.breakdown.contactClarity}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Lesbarkeit</span>
              <span className="font-semibold text-foreground">{result.breakdown.formattingReadability}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${result.breakdown.formattingReadability}%` }} />
            </div>
          </div>
        </div>

        {/* ATS Warnings & Recommendations */}
        {result.atsWarnings.length > 0 && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs space-y-1">
            <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Mögliche ATS-Stolperfallen:
            </span>
            {result.atsWarnings.map((w, i) => (
              <p key={i} className="text-muted-foreground">• {w}</p>
            ))}
          </div>
        )}

        {result.recommendations.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
            <span className="font-bold text-primary flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Empfehlungen zur Profil-Optimierung:
            </span>
            {result.recommendations.map((r, i) => (
              <p key={i} className="text-muted-foreground">• {r}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
