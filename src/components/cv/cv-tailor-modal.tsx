"use client";

// -----------------------------------------------------------------------------
// CV Tailor & Snapshot Modal
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { Sparkles, CheckCircle2, ArrowUpDown, FileText, Check, AlertCircle, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import type { PreferencesWithProfile, ApplicationListItem } from "@/types";
import { tailorCvToJob, TailoringResult } from "@/lib/documents/cvTailoring";
import { CvLayout, generateCvHtml } from "@/lib/documents/cvGenerator";

export function CvTailorModal({
  open,
  onClose,
  preferences,
  applications,
}: {
  open: boolean;
  onClose: () => void;
  preferences: PreferencesWithProfile;
  applications: ApplicationListItem[];
}) {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || "");
  const [applied, setApplied] = useState(false);

  const selectedApp = useMemo(
    () => applications.find((a) => a.id === selectedAppId),
    [applications, selectedAppId]
  );

  const tailoringResult: TailoringResult | null = useMemo(() => {
    if (!selectedApp) return null;
    return tailorCvToJob(preferences, {
      targetPosition: selectedApp.position,
      targetTechStack: selectedApp.tags,
      targetDescription: `${selectedApp.position} bei ${selectedApp.company.name}`,
    });
  }, [preferences, selectedApp]);

  function handlePrintTailored() {
    if (!tailoringResult) return;

    // Erstelle ein maßgeschneidertes Preferences-Objekt
    const tailoredPreferences: PreferencesWithProfile = {
      ...preferences,
      techStack: tailoringResult.tailoredTechStack.join(", "),
    };

    const html = generateCvHtml(tailoredPreferences, {
      layout: "MODERN_TWO_COLUMN",
      selectedProjectIds: tailoringResult.reorderedProjectIds,
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl p-6 border-border/80 bg-surface shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> CV Auto-Tailoring & Re-Ranking
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Stimme deine Skills und Projektreihenfolge automatisch auf eine bestimmte Ziel-Bewerbung ab.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Bewerbungsauswahl */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Ziel-Bewerbung auswählen
            </label>
            <Select
              value={selectedAppId}
              onChange={(e) => {
                setSelectedAppId(e.target.value);
                setApplied(false);
              }}
              className="w-full"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.position} @ {app.company.name}
                </option>
              ))}
            </Select>
          </div>

          {tailoringResult && (
            <div className="space-y-3 rounded-xl border border-border bg-surface-hover/30 p-4">
              {/* Match-Score Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-bold text-foreground">Keyword- & Profil-Match</span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-black text-emerald-600 dark:text-emerald-400">
                  {tailoringResult.matchScorePct}% Treffer
                </span>
              </div>

              {/* Gefundene & priorisierte Skills */}
              <div>
                <span className="font-semibold text-muted-foreground block mb-1.5">
                  Top-priorisierte Skills für diese Stelle:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tailoringResult.matchedKeywords.length > 0 ? (
                    tailoringResult.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300 font-semibold"
                      >
                        <Check className="h-3 w-3" /> {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">
                      Allgemeines Frontend-Profil wird verwendet
                    </span>
                  )}
                </div>
              </div>

              {/* Fehlende Keywords */}
              {tailoringResult.missingKeywords.length > 0 && (
                <div>
                  <span className="font-semibold text-muted-foreground block mb-1.5">
                    In Anzeige genannt, aber nicht in deinem Kern-Stack:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoringResult.missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-amber-600 dark:text-amber-400 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimierte Projektreihenfolge */}
              <div className="pt-1">
                <span className="font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                  <ArrowUpDown className="h-3 w-3 text-primary" /> Angepasste Projekt-Reihenfolge im CV:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  {tailoringResult.reorderedProjectIds.slice(0, 3).map((id, idx) => {
                    const proj = preferences.projectEntries.find((p) => p.id === id);
                    if (!proj) return null;
                    return (
                      <li key={id} className="truncate">
                        <strong className="text-foreground">{proj.title}</strong>{" "}
                        <span className="text-[10px]">({proj.techStack})</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Schließen
          </Button>

          <Button
            size="sm"
            onClick={handlePrintTailored}
            className="card-hover-effect text-xs"
            disabled={!tailoringResult}
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Maßgeschneiderten CV drucken (PDF)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
