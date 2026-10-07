"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Plus,
  Copy,
  HelpCircle,
  FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  analyzeAtsKeywords,
  AtsKeywordItem,
} from "@/lib/applications/atsKeywordMatcher";

interface AtsKeywordMatcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  jobDescription: string;
  coverLetterContent: string;
  cvText?: string;
  onInsertSnippet?: (snippetText: string) => void;
}

export function AtsKeywordMatcherModal({
  open,
  onOpenChange,
  jobTitle,
  jobDescription,
  coverLetterContent,
  cvText = "",
  onInsertSnippet,
}: AtsKeywordMatcherModalProps) {
  const toast = useToast();
  const [filterMode, setFilterMode] = useState<"ALL" | "MISSING" | "MATCHED">("ALL");
  const [search, setSearch] = useState("");

  const analysis = useMemo(() => {
    return analyzeAtsKeywords(jobDescription, coverLetterContent, cvText);
  }, [jobDescription, coverLetterContent, cvText]);

  const filteredKeywords = useMemo(() => {
    let list = analysis.keywords;
    if (filterMode === "MISSING") list = analysis.missingKeywords;
    if (filterMode === "MATCHED") list = analysis.matchedKeywords;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((k) => k.keyword.toLowerCase().includes(q));
    }
    return list;
  }, [analysis, filterMode, search]);

  function handleInsert(item: AtsKeywordItem) {
    if (!item.snippetSuggestion) return;
    onInsertSnippet?.(`\n\n${item.snippetSuggestion}`);
    toast.success(`Absatz für „${item.keyword}“ ins Anschreiben eingefügt!`);
  }

  function handleCopySnippet(item: AtsKeywordItem) {
    if (!item.snippetSuggestion) return;
    navigator.clipboard.writeText(item.snippetSuggestion);
    toast.success(`Formulierung für „${item.keyword}“ in die Zwischenablage kopiert.`);
  }

  const scoreColor =
    analysis.atsScore >= 80
      ? "text-emerald-500"
      : analysis.atsScore >= 50
      ? "text-amber-500"
      : "text-rose-500";

  const progressBg =
    analysis.atsScore >= 80
      ? "bg-emerald-500"
      : analysis.atsScore >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Interaktiver ATS-Keyword-Live-Matcher
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stellenanzeige vs. Anschreiben & CV: Erhöhe deine Trefferquote in ATS-Scannern (Workday, Personio).
              </p>
            </div>

            {/* Score Barometer */}
            <div className="flex items-center gap-3 bg-surface-hover/60 border border-border px-3.5 py-1.5 rounded-xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">ATS Match-Score</span>
                <span className={`text-xl font-extrabold ${scoreColor}`}>
                  {analysis.atsScore}%
                </span>
              </div>
              <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${progressBg} transition-all duration-500`}
                  style={{ width: `${analysis.atsScore}%` }}
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Controls: Filter & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={filterMode === "ALL" ? "primary" : "outline"}
                onClick={() => setFilterMode("ALL")}
                className="text-xs h-8"
              >
                Alle ({analysis.totalJobKeywords})
              </Button>
              <Button
                size="sm"
                variant={filterMode === "MISSING" ? "primary" : "outline"}
                onClick={() => setFilterMode("MISSING")}
                className="text-xs h-8 text-rose-600 dark:text-rose-400 border-rose-500/30"
              >
                Fehlend ({analysis.missingCount})
              </Button>
              <Button
                size="sm"
                variant={filterMode === "MATCHED" ? "primary" : "outline"}
                onClick={() => setFilterMode("MATCHED")}
                className="text-xs h-8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                Erfüllt ({analysis.matchedCount})
              </Button>
            </div>

            <div className="w-48">
              <Input
                placeholder="Keyword suchen …"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Side-by-Side Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Linke Spalte: Erkannte Keywords mit Schnell-Einbau */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Geforderte Keywords ({filteredKeywords.length})
              </h3>

              {filteredKeywords.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center text-xs text-muted-foreground">
                  Keine Keywords für diesen Filter gefunden.
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredKeywords.map((item) => (
                    <div
                      key={item.keyword}
                      className={`p-3 rounded-xl border transition-all ${
                        item.inCoverLetter
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-rose-500/30 bg-rose-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.inCoverLetter ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          )}
                          <span className="text-sm font-bold text-foreground">
                            {item.keyword}
                          </span>
                          <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground border border-border">
                            {item.category}
                          </span>
                        </div>

                        <span className="text-[11px] text-muted-foreground">
                          {item.inCoverLetter ? `Im Anschreiben (${item.frequencyInCoverLetter}x)` : "Fehlt im Anschreiben"}
                        </span>
                      </div>

                      {item.snippetSuggestion && (
                        <div className="mt-2 text-xs text-muted-foreground bg-surface p-2 rounded-lg border border-border/60">
                          <p className="italic text-[11.5px] leading-relaxed">
                            „{item.snippetSuggestion}“
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {onInsertSnippet && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleInsert(item)}
                                className="h-6 text-[11px] px-2 text-primary border-primary/40 hover:bg-primary-soft"
                              >
                                <Plus className="h-3 w-3 mr-1" /> 1-Klick Einfügen
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopySnippet(item)}
                              className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3 mr-1" /> Kopieren
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rechte Spalte: Live-Tipps & Jobbeschreibung-Ausschnitt */}
            <div className="space-y-3">
              <div className="rounded-xl border border-primary/30 bg-primary-soft/10 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5" /> Wie ATS-Scanner bewerten
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Moderne Bewerber-Management-Systeme (ATS) wie <em>Workday</em>, <em>Personio</em> und <em>Greenhouse</em> durchsuchen Anschreiben und Lebensläufe nach exakten Wortstämmen.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li><strong>Zielwert:</strong> Mindestens 70% Trefferquote im Anschreiben anstreben.</li>
                  <li><strong>Natürliche Integration:</strong> Keywords in echten Projektkontext einbinden, kein reines Aneinanderreihen.</li>
                  <li><strong>Synonyme:</strong> Z. B. „React“ und „React 19“ gezielt erwähnen.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 space-y-2 max-h-[36vh] overflow-y-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Stellenanzeige-Auszug ({jobTitle})
                </h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-10">
                  {jobDescription || "Keine ausführliche Beschreibung hinterlegt."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
