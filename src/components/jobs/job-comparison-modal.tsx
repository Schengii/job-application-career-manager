"use client";

// -----------------------------------------------------------------------------
// Side-by-Side Stellenvergleichs-Modal
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { Scale, CheckCircle2, X, Sparkles, Building2, MapPin, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareJobs, type JobComparisonItem } from "@/lib/jobs/jobComparison";
import type { JobPostingWithCompany } from "@/types";

export function JobComparisonModal({
  open,
  onClose,
  allJobs,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  allJobs: JobPostingWithCompany[];
  onApply: (jobId: string) => void;
}) {
  const [selectedIdA, setSelectedIdA] = useState<string>("");
  const [selectedIdB, setSelectedIdB] = useState<string>("");

  const jobA = useMemo(() => {
    const raw = allJobs.find((j) => j.id === (selectedIdA || allJobs[0]?.id));
    if (!raw) return null;
    return {
      id: raw.id,
      title: raw.title,
      companyName: raw.company?.name || "Unternehmen A",
      location: raw.location || "NRW",
      remote: raw.remote,
      salaryInfo: raw.salaryInfo || "45.000 €",
      matchScore: raw.matchScore || 0,
      techStack: raw.techStack || "",
      description: raw.description,
      portalSource: raw.portalSource,
    } as JobComparisonItem;
  }, [allJobs, selectedIdA]);

  const jobB = useMemo(() => {
    const raw = allJobs.find((j) => j.id === (selectedIdB || allJobs[1]?.id));
    if (!raw) return null;
    return {
      id: raw.id,
      title: raw.title,
      companyName: raw.company?.name || "Unternehmen B",
      location: raw.location || "NRW",
      remote: raw.remote,
      salaryInfo: raw.salaryInfo || "45.000 €",
      matchScore: raw.matchScore || 0,
      techStack: raw.techStack || "",
      description: raw.description,
      portalSource: raw.portalSource,
    } as JobComparisonItem;
  }, [allJobs, selectedIdB]);

  const comparison = useMemo(() => {
    if (!jobA || !jobB) return null;
    return compareJobs(jobA, jobB);
  }, [jobA, jobB]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-surface shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Side-by-Side Stellenvergleich
              </h2>
              <p className="text-xs text-muted-foreground">
                Zwei Stellenangebote auf Match-Score, Gehalt und Tech-Stack gegenüberstellen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-6">
          {/* Auswahl-Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">A</span>
                Erste Stelle auswählen:
              </label>
              <select
                value={selectedIdA || allJobs[0]?.id || ""}
                onChange={(e) => setSelectedIdA(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {allJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.company?.name}) - {j.matchScore}% Match
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] text-indigo-500">B</span>
                Zweite Stelle auswählen:
              </label>
              <select
                value={selectedIdB || allJobs[1]?.id || ""}
                onChange={(e) => setSelectedIdB(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {allJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.company?.name}) - {j.matchScore}% Match
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vergleichs-Karten */}
          {comparison && (
            <>
              {/* Empfehlungs-Banner */}
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary flex items-start gap-2.5">
                <Trophy className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Direkt-Empfehlung:</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground">
                    {comparison.recommendation}
                  </p>
                </div>
              </div>

              {/* Vergleichstabelle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stelle A */}
                <div className="rounded-xl border border-border bg-surface-hover/20 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{comparison.jobA.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" /> {comparison.jobA.companyName}
                      </p>
                    </div>
                    <span className="rounded-lg bg-primary/15 border border-primary/30 px-2.5 py-1 text-sm font-bold text-primary">
                      {comparison.jobA.matchScore}% Match
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {comparison.jobA.location} {comparison.jobA.remote && " (100% Remote)"}
                    </p>
                    <p className="font-medium text-foreground">💰 {comparison.jobA.salaryInfo}</p>
                    <p className="text-[11px]">Portal: {comparison.jobA.portalSource}</p>
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-muted-foreground mb-1">Exklusive Technologien:</p>
                    <div className="flex flex-wrap gap-1">
                      {comparison.uniqueTechA.length > 0 ? (
                        comparison.uniqueTechA.map((t) => (
                          <span key={t} className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            +{t}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Keine exklusiven</span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-3 card-hover-effect"
                    onClick={() => {
                      onClose();
                      onApply(comparison.jobA.id);
                    }}
                  >
                    <Send className="h-3.5 w-3.5 text-white" />
                    <span>Auf Stelle A bewerben</span>
                  </Button>
                </div>

                {/* Stelle B */}
                <div className="rounded-xl border border-border bg-surface-hover/20 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{comparison.jobB.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" /> {comparison.jobB.companyName}
                      </p>
                    </div>
                    <span className="rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 text-sm font-bold text-indigo-500">
                      {comparison.jobB.matchScore}% Match
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {comparison.jobB.location} {comparison.jobB.remote && " (100% Remote)"}
                    </p>
                    <p className="font-medium text-foreground">💰 {comparison.jobB.salaryInfo}</p>
                    <p className="text-[11px]">Portal: {comparison.jobB.portalSource}</p>
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-muted-foreground mb-1">Exklusive Technologien:</p>
                    <div className="flex flex-wrap gap-1">
                      {comparison.uniqueTechB.length > 0 ? (
                        comparison.uniqueTechB.map((t) => (
                          <span key={t} className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            +{t}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Keine exklusiven</span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-3 card-hover-effect"
                    onClick={() => {
                      onClose();
                      onApply(comparison.jobB.id);
                    }}
                  >
                    <Send className="h-3.5 w-3.5 text-white" />
                    <span>Auf Stelle B bewerben</span>
                  </Button>
                </div>
              </div>

              {/* Gemeinsame Technologien */}
              {comparison.commonTech.length > 0 && (
                <div className="rounded-lg border border-border bg-surface p-3 text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Gemeinsamer Tech-Stack ({comparison.commonTech.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {comparison.commonTech.map((t) => (
                      <span key={t} className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-2.5 w-2.5" /> {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-6 py-4 bg-surface-hover/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
