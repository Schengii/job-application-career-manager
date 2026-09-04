"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, HelpCircle } from "lucide-react";
import { analyzeJobRedFlags, type JobFlagsAnalysis } from "@/lib/jobs/jobRedFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function JobRedFlagsCard({ text }: { text: string }) {
  const analysis: JobFlagsAnalysis = useMemo(() => analyzeJobRedFlags(text), [text]);

  if (!text || (analysis.redFlags.length === 0 && analysis.greenFlags.length === 0)) {
    return null;
  }

  const scoreBadgeColor =
    analysis.score >= 80 ? "green" : analysis.score >= 60 ? "amber" : "red";

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Arbeitgeber-Audit & Benefit-Scanner</CardTitle>
        </div>
        <Badge color={scoreBadgeColor}>
          Attraktivitäts-Score: {analysis.score}/100
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-xs text-muted-foreground">{analysis.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Green Flags */}
          {analysis.greenFlags.length > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Positive Signale & Benefits ({analysis.greenFlags.length})
              </span>
              <ul className="space-y-1.5 text-xs text-foreground">
                {analysis.greenFlags.map((gf) => (
                  <li key={gf.id} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <div>
                      <span className="font-semibold">{gf.title}</span>
                      <p className="text-[11px] text-muted-foreground">{gf.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Red Flags */}
          {analysis.redFlags.length > 0 && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 space-y-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Potenzielle Warnsignale ({analysis.redFlags.length})
              </span>
              <ul className="space-y-1.5 text-xs text-foreground">
                {analysis.redFlags.map((rf) => (
                  <li key={rf.id} className="flex items-start gap-1.5">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <div>
                      <span className="font-semibold">{rf.title}</span>
                      <p className="text-[11px] text-muted-foreground">{rf.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Empfohlene Gegenfragen für das Gespräch */}
        {analysis.interviewQuestions.length > 0 && (
          <div className="rounded-lg bg-surface-hover/50 border border-border p-3 text-xs space-y-1.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-primary" /> Empfohlene Gegenfragen für dein Vorstellungsgespräch:
            </span>
            <ul className="space-y-1 text-muted-foreground pl-2">
              {analysis.interviewQuestions.map((q, idx) => (
                <li key={idx} className="list-disc list-inside">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
