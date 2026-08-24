"use client";

// -----------------------------------------------------------------------------
// Anschreiben Keyword-Booster & ATS Match Komponente
// -----------------------------------------------------------------------------
import { useMemo } from "react";
import { Sparkles, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { analyzeCoverLetterKeywords } from "@/lib/keywordBooster";
import { Button } from "@/components/ui/button";

export function CoverLetterKeywordBooster({
  coverLetterContent,
  jobDescription,
  onAddSentence,
}: {
  coverLetterContent: string;
  jobDescription?: string | null;
  onAddSentence: (sentence: string) => void;
}) {
  const analysis = useMemo(() => {
    return analyzeCoverLetterKeywords(coverLetterContent, jobDescription || "");
  }, [coverLetterContent, jobDescription]);

  if (!coverLetterContent) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-hover/30 p-4 space-y-3 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Keyword-Booster & ATS-Match
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Tech-Keywords:</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              analysis.matchScore >= 70
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : analysis.matchScore >= 40
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }`}
          >
            {analysis.matchScore}% Match
          </span>
        </div>
      </div>

      {/* Keywords Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {analysis.matchedKeywords.map((kw) => (
          <span
            key={kw}
            className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
            title="Im Anschreiben enthalten"
          >
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            {kw}
          </span>
        ))}

        {analysis.missingKeywords.map((kw) => (
          <span
            key={kw}
            className="flex items-center gap-1 rounded-md border border-border/80 bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground line-through opacity-75"
            title="Fehlt im Anschreiben"
          >
            <AlertCircle className="h-3 w-3 shrink-0 text-amber-500" />
            {kw}
          </span>
        ))}
      </div>

      {/* Vorschläge zum 1-Klick Einfügen */}
      {analysis.suggestions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Vorgeschlagene Textbausteine für fehlende Keywords:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {analysis.suggestions.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface p-2 text-xs"
              >
                <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  „{s.sampleSentence}“
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onAddSentence(s.sampleSentence)}
                  className="h-7 shrink-0 px-2 text-[10px] card-hover-effect"
                  title="Satz an Anschreiben anhängen"
                >
                  <Plus className="h-3 w-3" /> Einfügen
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
