"use client";

import { useState } from "react";
import { Copy, Check, SplitSquareVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  generateCoverLetterAbVariants,
  type CoverLetterAbComparison,
} from "@/lib/documents/coverLetterAbTesting";

interface CoverLetterAbModalProps {
  companyName: string;
  position: string;
  techStack?: string | null;
  applicantName?: string | null;
}

export function CoverLetterAbCard({
  companyName,
  position,
  techStack,
  applicantName,
}: CoverLetterAbModalProps) {
  const toast = useToast();
  const [data] = useState<CoverLetterAbComparison>(() =>
    generateCoverLetterAbVariants({
      companyName: companyName || "Zielunternehmen",
      position: position || "Frontend Entwickler",
      techStack: techStack || "React, TypeScript, Next.js",
      applicantName: applicantName || "Bewerber",
    })
  );

  const [copiedVariant, setCopiedVariant] = useState<string | null>(null);

  function handleCopy(text: string, variantId: string) {
    navigator.clipboard.writeText(text);
    setCopiedVariant(variantId);
    toast.success(`Variante ${variantId} in die Zwischenablage kopiert!`);
    setTimeout(() => setCopiedVariant(null), 2500);
  }

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <SplitSquareVertical className="h-5 w-5 text-indigo-500" />
              Anschreiben A/B-Split-Testing & Varianten-Vergleich
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Vergleiche zwei zielgerichtete Stilrichtungen nebeneinander und wähle die passende Tonalität für das Unternehmen.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Variante A */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  {data.variantA.title}
                </span>
                <span className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full">
                  Code & Architektur
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Schwerpunkt: {data.variantA.focus}
              </p>
              <div className="rounded-lg bg-surface border border-border/60 p-3 text-xs leading-relaxed text-foreground space-y-2">
                <p className="font-semibold text-primary/90">{data.variantA.openingSentence}</p>
                <p>{data.variantA.highlightParagraph}</p>
                <p className="text-muted-foreground">{data.variantA.closingSentence}</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCopy(data.variantA.fullDraft, "A")}
                className="h-8 text-xs"
              >
                {copiedVariant === "A" ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Kopiert
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Variante A übernehmen
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Variante B */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {data.variantB.title}
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                  Agil & Teamplayer
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Schwerpunkt: {data.variantB.focus}
              </p>
              <div className="rounded-lg bg-surface border border-border/60 p-3 text-xs leading-relaxed text-foreground space-y-2">
                <p className="font-semibold text-primary/90">{data.variantB.openingSentence}</p>
                <p>{data.variantB.highlightParagraph}</p>
                <p className="text-muted-foreground">{data.variantB.closingSentence}</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCopy(data.variantB.fullDraft, "B")}
                className="h-8 text-xs"
              >
                {copiedVariant === "B" ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Kopiert
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Variante B übernehmen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
