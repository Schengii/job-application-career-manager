"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ExternalLink, MapPin, Building2, Send, Sparkles, Search, X } from "lucide-react";
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
  if (score >= 75) return "text-success border-success/30 bg-success-soft/40";
  if (score >= 50) return "text-warning border-warning/30 bg-warning-soft/40";
  return "text-muted-foreground border-border bg-surface-hover/30";
}

type SortOption = "SCORE_DESC" | "DATE_DESC" | "COMPANY_ASC";

export default function JobsPage() {
  const { data: jobs, isLoading } = useSWR<JobPostingWithCompany[]>("/api/jobs", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [portalFilter, setPortalFilter] = useState("ALL");
  const [matchFilter, setMatchFilter] = useState("ALL");
  const [remoteFilter, setRemoteFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("SCORE_DESC");

  const [simulating, setSimulating] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [parserOpen, setParserOpen] = useState(false);

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

  const hasActiveFilters = portalFilter !== "ALL" || matchFilter !== "ALL" || remoteFilter !== "ALL" || searchQuery.trim() !== "";

  function resetFilters() {
    setPortalFilter("ALL");
    setMatchFilter("ALL");
    setRemoteFilter("ALL");
    setSearchQuery("");
  }

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
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobsuche</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stellenangebote durchsuchen, nach Match-Score filtern und automatisch anhand deiner Präferenzen abgleichen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setParserOpen(true)} className="card-hover-effect">
            <Sparkles className="h-4 w-4" /> Anzeige einfügen (Parser)
          </Button>
          <Button onClick={handleSimulate} disabled={simulating} className="card-hover-effect">
            <RefreshCw className={cn("h-4 w-4", simulating && "animate-spin")} />
            {simulating ? "Suche läuft …" : "Portale durchsuchen"}
          </Button>
        </div>
      </header>

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

        <span className="text-xs text-muted-foreground">
          {filtered.length} von {jobs?.length ?? 0} Angeboten
        </span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Stellenangebote …</p>}
      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          Keine Stellenangebote für diesen Filter gefunden. Klicke auf „Jobportale durchsuchen“, um neue Angebote abzurufen.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <Card key={job.id} className="flex flex-col gap-3 p-5 card-hover-effect">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{job.title}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" /> {job.company?.name ?? "Unbekanntes Unternehmen"}
                </p>
              </div>
              <div className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-center font-bold", matchColor(job.matchScore ?? 0))}>
                <p className="text-base font-semibold leading-none">{job.matchScore ?? 0}%</p>
                <p className="text-[10px] uppercase opacity-75">Match</p>
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

            <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border/50">
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
              <Button size="sm" onClick={() => handleApply(job.id)} disabled={applyingId === job.id} className="card-hover-effect">
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
