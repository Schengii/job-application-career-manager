"use client";

// -----------------------------------------------------------------------------
// Karte eines Stellenangebots in der Jobliste (Match-Score, Metadaten,
// Red Flags, Aktionen). Ausgelagert aus src/app/jobs/page.tsx.
// -----------------------------------------------------------------------------
import {
  ExternalLink,
  MapPin,
  Building2,
  Send,
  RotateCcw,
  Ban,
  EyeOff,
} from "lucide-react";
import type { JobPostingWithCompany } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core/utils";
import { JOB_PORTALS, JOB_DISMISS_REASONS, findStatusMeta } from "@/lib/core/constants";
import { JobRedFlagsCard } from "@/components/jobs/job-red-flags-card";
import { SalaryTransparencyBadge } from "@/components/jobs/salary-transparency-badge";

function matchColor(score: number) {
  if (score >= 75) return "text-success border-success/30 bg-success-soft/40";
  if (score >= 50) return "text-warning border-warning/30 bg-warning-soft/40";
  return "text-muted-foreground border-border bg-surface-hover/30";
}

type Props = {
  job: JobPostingWithCompany;
  /** Gerade wird für dieses Angebot eine Bewerbung angelegt. */
  applying: boolean;
  /** Gerade wird dieses Angebot wiederhergestellt. */
  restoring: boolean;
  onApply: (jobId: string) => void;
  onRestore: (jobId: string) => void;
  onDismiss: (job: JobPostingWithCompany) => void;
};

export function JobCard({ job, applying, restoring, onApply, onRestore, onDismiss }: Props) {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between gap-3 p-5 card-hover-effect border-border/80",
        job.isDismissed && "opacity-80 bg-surface/60 border-dashed"
      )}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm leading-snug">{job.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground font-medium">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" /> {job.company?.name ?? "Unbekanntes Unternehmen"}
            </p>
          </div>
          <div className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-center font-bold", matchColor(job.matchScore ?? 0))}>
            <p className="text-base font-semibold leading-none">{job.matchScore ?? 0}%</p>
            <p className="text-[10px] uppercase opacity-75">Match</p>
          </div>
        </div>

        {/* Status & Metadaten */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {job.location ?? "—"} {job.remote && "(Remote)"}
          </span>
          <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-foreground">
            {findStatusMeta(JOB_PORTALS, job.portalSource)?.label ?? job.portalSource}
          </span>
          {job.salaryInfo && <span className="font-medium text-foreground">{job.salaryInfo}</span>}
          <SalaryTransparencyBadge salaryInfo={job.salaryInfo} description={job.description} role={job.title} />

          {job.isDismissed && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <Ban className="h-3 w-3" />
              Ausgeblendet: {findStatusMeta(JOB_DISMISS_REASONS, job.dismissReason ?? "")?.label ?? job.dismissReason ?? "Manuell"}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{job.description}</p>

        {job.techStack && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.techStack.split(",").map((t) => (
              <span key={t} className="rounded-md bg-surface-hover/80 border border-border/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
                {t.trim()}
              </span>
            ))}
          </div>
        )}

        <JobRedFlagsCard text={`${job.description} ${job.requirementsProfile ?? ""} ${job.salaryInfo ?? ""}`} />
      </div>

      {/* Aktionen Footer */}
      <div className="mt-2 flex items-center justify-between gap-2 pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          {job.sourceUrl && (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Original-Anzeige <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!job.isDismissed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss(job)}
              className="h-8 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              title="Unpassendes Angebot ausblenden & Ausschlusskriterien lernen"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ausblenden</span>
            </Button>
          )}
        </div>

        {job.isDismissed ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(job.id)}
            disabled={restoring}
            className="h-8 text-xs card-hover-effect"
          >
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            <span>{restoring ? "Wird aktiviert …" : "Wiederherstellen"}</span>
          </Button>
        ) : (
          <Button size="sm" onClick={() => onApply(job.id)} disabled={applying} className="card-hover-effect">
            <Send className="h-3.5 w-3.5 text-white" />
            <span>{applying ? "Wird angelegt …" : "Direkt bewerben"}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
