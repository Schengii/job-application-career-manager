"use client";

import { useMemo, useState } from "react";
import { Sparkles, Copy, Check, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auditAnswerWithStar, type StarAuditResult } from "@/lib/starAudit";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function StarAuditModal({
  open,
  onClose,
  question,
  answer,
}: {
  open: boolean;
  onClose: () => void;
  question: string;
  answer: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const result: StarAuditResult = useMemo(
    () => auditAnswerWithStar(question, answer),
    [question, answer]
  );

  function handleCopySample() {
    navigator.clipboard.writeText(result.improvedSampleAnswer);
    setCopied(true);
    toast.success("Muster-Antwort in Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  const scoreBadgeColor =
    result.totalScore >= 80 ? "green" : result.totalScore >= 60 ? "amber" : "red";

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Star className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold">
                  STAR-Methoden Antwort-Audit
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Situation · Task · Action · Result (Entwickler-Standard für Fachinterviews)
                </p>
              </div>
            </div>
            <Badge color={scoreBadgeColor}>
              Score: {result.totalScore}/100 ({result.rating})
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Geprüfte Frage & Antwort */}
          <div className="rounded-lg border border-border bg-surface-hover/30 p-3 space-y-1.5 text-xs">
            <span className="font-bold text-foreground">Frage: {question}</span>
            <p className="text-muted-foreground italic line-clamp-3">
              Deine Antwort: „{answer || "Keine Antwort hinterlegt"}“
            </p>
          </div>

          {/* Die 4 STAR Dimensionen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {result.dimensions.map((dim) => (
              <div
                key={dim.name}
                className={cn(
                  "rounded-lg border p-3 space-y-1 text-xs",
                  dim.status === "EXCELLENT"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : dim.status === "SOLID"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-rose-500/30 bg-rose-500/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{dim.label}</span>
                  <span className={cn(
                    "text-[11px] font-bold",
                    dim.status === "EXCELLENT" ? "text-emerald-600 dark:text-emerald-400" :
                    dim.status === "SOLID" ? "text-amber-500" : "text-rose-500"
                  )}>
                    {dim.score}/25 Pkt.
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{dim.feedback}</p>
              </div>
            ))}
          </div>

          {/* Stärken & Tipps */}
          {result.improvements.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-3 text-xs space-y-1">
              <span className="font-semibold text-foreground">Optimierungspotenzial:</span>
              <ul className="text-muted-foreground space-y-0.5 pl-2">
                {result.improvements.map((imp, idx) => (
                  <li key={idx} className="list-disc list-inside">
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optimierte Muster-Antwort */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Vorschlag: Optimierte STAR-Formulierung
              </span>
              <Button size="sm" variant="ghost" onClick={handleCopySample} className="h-7 text-xs">
                {copied ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? "Kopiert" : "Kopieren"}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-foreground font-sans bg-surface/80 p-2.5 rounded border border-border/60">
              {result.improvedSampleAnswer}
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={onClose}>
              Verstanden & Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
