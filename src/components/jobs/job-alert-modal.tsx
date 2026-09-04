"use client";

// -----------------------------------------------------------------------------
// Job-Alerts & Match-Radar Modal (Automatischer Benachrichtigungs-Digest)
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { BellRing, CheckCircle2, Copy, Send, Sparkles, X, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { evaluateJobAlerts, type JobAlertCriteria, DEFAULT_ALERT_CRITERIA } from "@/lib/jobs/jobAlerts";
import type { JobPostingWithCompany } from "@/types";

export function JobAlertModal({
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
  const toast = useToast();
  const [minScore, setMinScore] = useState<number>(75);
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [copied, setCopied] = useState(false);

  const criteria: JobAlertCriteria = useMemo(() => ({
    ...DEFAULT_ALERT_CRITERIA,
    minScore,
    locationFilter,
  }), [minScore, locationFilter]);

  const digest = useMemo(() => {
    return evaluateJobAlerts(allJobs, criteria);
  }, [allJobs, criteria]);

  if (!open) return null;

  function handleCopyDigest() {
    const lines = [
      digest.digestSubject,
      "=========================================",
      digest.summaryText,
      "",
      ...digest.topMatches.map(
        (m, i) =>
          `${i + 1}. ${m.title} (${m.companyName})\n   📍 ${m.location} | 💰 ${m.salaryInfo} | 🎯 Match: ${m.matchScore}%\n   Tech: ${m.techStack}`
      ),
      "",
      "Automatisch generiert vom Job Application & Career Manager",
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Job-Radar Digest in die Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Job-Alerts & Match-Radar
              </h2>
              <p className="text-xs text-muted-foreground">
                Täglicher Benachrichtigungs-Report über neue Top-Matches
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
        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-5">
          {/* Filter-Kriterien Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-surface-hover/30 p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mindest-Match-Score: <strong className="text-primary">{minScore}%</strong>
              </label>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>50% (Mehr Treffer)</span>
                <span>90% (Nur Spitzen-Matches)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Regionale Eingrenzung:</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Alle Regionen & Remote</option>
                <option value="BONN_KOELN">Bonn & Köln (+ Remote)</option>
                <option value="RUHRGEBIET">Dortmund & Ruhrgebiet (+ Remote)</option>
                <option value="REMOTE">Nur 100% Remote</option>
              </select>
            </div>
          </div>

          {/* Digest Zusammenfassung */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> {digest.digestSubject}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{digest.summaryText}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopyDigest} className="h-8 shrink-0 text-xs">
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Kopiert" : "Digest kopieren"}</span>
            </Button>
          </div>

          {/* Matches Liste */}
          <div className="space-y-2.5">
            {digest.topMatches.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Keine aktuellen Stellenangebote erfüllen diese Kriterien. Reduziere den Mindest-Score für mehr Ergebnisse.
              </p>
            )}

            {digest.topMatches.map((match) => (
              <div
                key={match.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3.5 transition-colors hover:bg-surface-hover/50"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-xs text-foreground truncate">{match.title}</p>
                    <span className="shrink-0 rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {match.matchScore}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {match.companyName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {match.location}
                    </span>
                    <span>💰 {match.salaryInfo}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {match.techStack.split(",").slice(0, 4).map((t) => (
                      <span key={t} className="rounded bg-surface-hover px-1.5 py-0.2 text-[10px] text-muted-foreground">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onApply(match.id);
                  }}
                  className="shrink-0 card-hover-effect text-xs"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                  <span>Bewerben</span>
                </Button>
              </div>
            ))}
          </div>
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
