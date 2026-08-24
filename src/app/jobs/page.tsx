"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ExternalLink, MapPin, Building2, Send, Sparkles } from "lucide-react";
import { fetcher, apiPost } from "@/lib/api";
import type { JobPostingWithCompany } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { JOB_PORTALS, findStatusMeta } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { JobTextParserModal } from "@/components/jobs/job-text-parser-modal";

function matchColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-muted-foreground";
}

export default function JobsPage() {
  const { data: jobs, isLoading } = useSWR<JobPostingWithCompany[]>("/api/jobs", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const router = useRouter();

  const [portalFilter, setPortalFilter] = useState("ALL");
  const [simulating, setSimulating] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [parserOpen, setParserOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    if (portalFilter === "ALL") return jobs;
    return jobs.filter((j) => j.portalSource === portalFilter);
  }, [jobs, portalFilter]);

  async function handleSimulate() {
    setSimulating(true);
    try {
      await apiPost("/api/jobs/simulate", { count: 6 });
      await mutate("/api/jobs");
      toast.success("Neue Stellenangebote von den Jobportalen abgerufen.");
    } catch {
      toast.error("Job-Suche fehlgeschlagen.");
    } finally {
      setSimulating(false);
    }
  }

  async function handleApply(jobId: string) {
    setApplyingId(jobId);
    try {
      const application = await apiPost<{ id: string }>(`/api/jobs/${jobId}/apply`, undefined);
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
      toast.success("Bewerbung wurde als Entwurf angelegt.");
      router.push(`/applications/${application.id}`);
    } catch {
      toast.error("Bewerben fehlgeschlagen.");
      setApplyingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobsuche</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stellenangebote durchsuchen, analysieren und automatisch anhand deiner Präferenzen matchen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setParserOpen(true)}>
            <Sparkles className="h-4 w-4" /> Anzeige einfügen (Parser)
          </Button>
          <Button onClick={handleSimulate} disabled={simulating}>
            <RefreshCw className={cn("h-4 w-4", simulating && "animate-spin")} />
            {simulating ? "Suche läuft …" : "Portale durchsuchen"}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="portal-filter" className="text-sm font-medium text-foreground">
          Portal:
        </label>
        <Select id="portal-filter" value={portalFilter} onChange={(e) => setPortalFilter(e.target.value)} className="w-auto">
          <option value="ALL">Alle Portale</option>
          {JOB_PORTALS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Stellenangebote …</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Keine Stellenangebote gefunden. Klicke auf „Jobportale durchsuchen“, um neue Angebote zu simulieren.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <Card key={job.id} className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{job.title}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" /> {job.company?.name ?? "Unbekanntes Unternehmen"}
                </p>
              </div>
              <div className={cn("shrink-0 rounded-lg border border-border px-2.5 py-1 text-center", matchColor(job.matchScore ?? 0))}>
                <p className="text-base font-semibold leading-none">{job.matchScore ?? 0}%</p>
                <p className="text-[10px] text-muted-foreground">Match</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.location ?? "—"} {job.remote && "(Remote)"}
              </span>
              <span>{findStatusMeta(JOB_PORTALS, job.portalSource)?.label ?? job.portalSource}</span>
              {job.salaryInfo && <span>{job.salaryInfo}</span>}
            </div>

            <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

            {job.techStack && (
              <div className="flex flex-wrap gap-1.5">
                {job.techStack.split(",").map((t) => (
                  <span key={t} className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-muted-foreground">
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              {job.sourceUrl ? (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Anzeige ansehen <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span />
              )}
              <Button size="sm" onClick={() => handleApply(job.id)} disabled={applyingId === job.id}>
                <Send className="h-3.5 w-3.5" /> {applyingId === job.id ? "…" : "Bewerben"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Präferenzen für das Matching lassen sich unter{" "}
        <Link href="/settings" className="text-primary hover:underline">
          Einstellungen
        </Link>{" "}
        anpassen.
      </p>

      <JobTextParserModal open={parserOpen} onClose={() => setParserOpen(false)} />
    </div>
  );
}
