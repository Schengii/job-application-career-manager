"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  MapPin,
  Building2,
  Send,
  Sparkles,
  Search,
  X,
  Briefcase,
  Scale,
  BellRing,
  Compass,
} from "lucide-react";
import { fetcher, apiPost } from "@/lib/api";
import type { JobPostingWithCompany } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { JOB_PORTALS, findStatusMeta } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { JobTextParserModal } from "@/components/jobs/job-text-parser-modal";
import { MultiPortalSyncBanner } from "@/components/jobs/multi-portal-sync-banner";
import { JobComparisonModal } from "@/components/jobs/job-comparison-modal";
import { JobAlertModal } from "@/components/jobs/job-alert-modal";
import { CommuteRadarCard } from "@/components/jobs/commute-radar-card";

function matchColor(score: number) {
  if (score >= 75) return "text-success border-success/30 bg-success-soft/40";
  if (score >= 50) return "text-warning border-warning/30 bg-warning-soft/40";
  return "text-muted-foreground border-border bg-surface-hover/30";
}

type SortOption = "SCORE_DESC" | "DATE_DESC" | "COMPANY_ASC";

export default function JobsPage() {
  const { data: jobs, isLoading, mutate: mutateJobs } = useSWR<JobPostingWithCompany[]>("/api/jobs", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [portalFilter, setPortalFilter] = useState("ALL");
  const [matchFilter, setMatchFilter] = useState("ALL");
  const [remoteFilter, setRemoteFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("SCORE_DESC");

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [parserOpen, setParserOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [showCommuteRadar, setShowCommuteRadar] = useState(true);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    let list = [...jobs];

    // Portal Filter
    if (portalFilter !== "ALL") {
      list = list.filter((j) => j.portalSource === portalFilter);
    }

    // Match Filter
    if (matchFilter === "TOP") {
      list = list.filter((j) => (j.matchScore ?? 0) >= 75);
    } else if (matchFilter === "GOOD") {
      list = list.filter((j) => (j.matchScore ?? 0) >= 50);
    }

    // Remote Filter
    if (remoteFilter === "REMOTE") {
      list = list.filter((j) => j.remote);
    } else if (remoteFilter === "ONSITE") {
      list = list.filter((j) => !j.remote);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.company?.name && j.company.name.toLowerCase().includes(q)) ||
          (j.techStack && j.techStack.toLowerCase().includes(q)) ||
          (j.location && j.location.toLowerCase().includes(q)) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "SCORE_DESC") {
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      }
      if (sortBy === "DATE_DESC") {
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
      if (sortBy === "COMPANY_ASC") {
        return (a.company?.name || "").localeCompare(b.company?.name || "");
      }
      return 0;
    });

    return list;
  }, [jobs, portalFilter, matchFilter, remoteFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    portalFilter !== "ALL" || matchFilter !== "ALL" || remoteFilter !== "ALL" || searchQuery.trim() !== "";

  function resetFilters() {
    setPortalFilter("ALL");
    setMatchFilter("ALL");
    setRemoteFilter("ALL");
    setSearchQuery("");
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
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobsuche & Live-Stellenportal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatisch aggregierte Stellenangebote von allen großen Portalen, abgeglichen mit deinem Entwicklerprofil.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setComparisonOpen(true)}
            className="card-hover-effect"
            disabled={!jobs || jobs.length < 2}
          >
            <Scale className="h-4 w-4 text-primary" /> Stellen vergleichen
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAlertOpen(true)}
            className="card-hover-effect"
          >
            <BellRing className="h-4 w-4 text-amber-500" /> Job-Alerts
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommuteRadar(!showCommuteRadar)}
            className="card-hover-effect"
          >
            <Compass className="h-4 w-4 text-sky-500" /> {showCommuteRadar ? "Pendel-Radar verbergen" : "Pendel-Radar"}
          </Button>

          <Button variant="outline" size="sm" onClick={() => setParserOpen(true)} className="card-hover-effect">
            <Sparkles className="h-4 w-4 text-primary" /> Smart Parser
          </Button>
        </div>
      </header>

      {/* Multi-Portal Sync Banner */}
      <MultiPortalSyncBanner jobs={jobs ?? []} onSyncComplete={() => mutateJobs()} />

      {/* NRW & Remote Pendel-Radar Card */}
      {showCommuteRadar && <CommuteRadarCard />}

      {/* Filter- & Suchleiste */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 glass-card">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Jobtitel, Firma, Tech-Stack suchen …"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Portal Filter */}
          <Select
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value)}
            className="h-9 w-auto text-xs"
          >
            <option value="ALL">Alle Portale</option>
            {JOB_PORTALS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>

          {/* Match-Score Filter */}
          <Select
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
            className="h-9 w-auto text-xs"
          >
            <option value="ALL">Jeder Match-Score</option>
            <option value="TOP">Top Matches (≥ 75%)</option>
            <option value="GOOD">Gute Matches (≥ 50%)</option>
          </Select>

          {/* Remote Filter */}
          <Select
            value={remoteFilter}
            onChange={(e) => setRemoteFilter(e.target.value)}
            className="h-9 w-auto text-xs"
          >
            <option value="ALL">Alle Arbeitsmodelle</option>
            <option value="REMOTE">Nur Remote</option>
            <option value="ONSITE">Vor Ort / Hybrid</option>
          </Select>

          {/* Sortierung */}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 w-auto text-xs"
          >
            <option value="SCORE_DESC">Bester Match zuerst</option>
            <option value="DATE_DESC">Neueste Anzeigen zuerst</option>
            <option value="COMPANY_ASC">Unternehmen (A–Z)</option>
          </Select>

          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters} className="h-9 text-xs text-muted-foreground hover:text-danger">
              <X className="h-3.5 w-3.5" /> Filter zurücksetzen
            </Button>
          )}
        </div>

        <span className="text-xs font-semibold text-muted-foreground">
          {filtered.length} von {jobs?.length ?? 0} Angeboten
        </span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Stellenangebote …</p>}
      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">Keine Stellenangebote für diese Filterauswahl gefunden.</p>
          <p className="mt-1 text-xs">
            Klicke oben auf „Jetzt alle Portale abgleichen“ oder setze die Filter zurück.
          </p>
        </div>
      )}

      {/* Grid der Stellenanzeigen */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <Card key={job.id} className="flex flex-col justify-between gap-3 p-5 card-hover-effect border-border/80">
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

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {job.location ?? "—"} {job.remote && "(Remote)"}
                </span>
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                  {findStatusMeta(JOB_PORTALS, job.portalSource)?.label ?? job.portalSource}
                </span>
                {job.salaryInfo && <span className="font-medium text-foreground">{job.salaryInfo}</span>}
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
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 pt-3 border-t border-border/50">
              {job.sourceUrl ? (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Original-Anzeige öffnen <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span />
              )}
              <Button size="sm" onClick={() => handleApply(job.id)} disabled={applyingId === job.id} className="card-hover-effect">
                <Send className="h-3.5 w-3.5 text-white" />
                <span>{applyingId === job.id ? "Wird angelegt …" : "Direkt bewerben"}</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Matching-Präferenzen (Standort, Wunschgehalt, Tech-Stack) können jederzeit unter{" "}
        <Link href="/settings" className="text-primary font-semibold hover:underline">
          Einstellungen
        </Link>{" "}
        angepasst werden.
      </p>

      {/* Modale */}
      <JobTextParserModal open={parserOpen} onClose={() => setParserOpen(false)} />
      <JobComparisonModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        allJobs={jobs ?? []}
        onApply={handleApply}
      />
      <JobAlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        allJobs={jobs ?? []}
        onApply={handleApply}
      />
    </div>
  );
}
