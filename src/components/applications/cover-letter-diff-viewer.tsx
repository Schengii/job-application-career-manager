"use client";

import { useMemo } from "react";
import { computeTextDiff } from "@/lib/documents/diff";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface CoverLetterDiffViewerProps {
  originalText: string;
  modifiedText: string;
  onApply: (appliedText: string) => void;
  onCancel: () => void;
}

export function CoverLetterDiffViewer({
  originalText,
  modifiedText,
  onApply,
  onCancel,
}: CoverLetterDiffViewerProps) {
  const diff = useMemo(() => computeTextDiff(originalText, modifiedText), [originalText, modifiedText]);

  return (
    <div className="rounded-xl border border-primary/30 bg-surface shadow-lg overflow-hidden flex flex-col my-3">
      <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Revisions-Vergleich (Vorher vs. Nachher)
          </span>
          <span className="text-xs text-muted-foreground">
            +{diff.addedCount} Zeilen, -{diff.removedCount} Zeilen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs h-7 px-2.5"
          >
            <X className="h-3.5 w-3.5 mr-1" /> Verwerfen
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onApply(modifiedText)}
            className="text-xs h-7 px-2.5"
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Änderungen übernehmen
          </Button>
        </div>
      </div>

      <div className="p-3 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5 bg-background/50">
        {diff.lines.map((line, idx) => {
          if (line.type === "ADDED") {
            return (
              <div
                key={idx}
                className="flex items-start gap-2 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              >
                <span className="select-none font-bold text-emerald-600 dark:text-emerald-400 w-4 text-center">+</span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.text || " "}</span>
              </div>
            );
          }
          if (line.type === "REMOVED") {
            return (
              <div
                key={idx}
                className="flex items-start gap-2 px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 line-through opacity-80"
              >
                <span className="select-none font-bold text-rose-600 dark:text-rose-400 w-4 text-center">-</span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.text || " "}</span>
              </div>
            );
          }
          return (
            <div key={idx} className="flex items-start gap-2 px-2 py-0.5 text-muted-foreground">
              <span className="select-none text-muted-foreground/40 w-4 text-center"> </span>
              <span className="whitespace-pre-wrap break-words flex-1">{line.text || " "}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
