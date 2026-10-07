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
  EyeOff,
  RotateCcw,
  Ban,
  Filter,
} from "lucide-react";
import { fetcher, apiPost } from "@/lib/core/api";
import type { JobPostingWithCompany, PreferencesPublic } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/core/utils";
import { JOB_PORTALS, JOB_DISMISS_REASONS, findStatusMeta } from "@/lib/core/constants";
import { useToast } from "@/components/ui/toast";
import { JobTextParserModal } from "@/components/jobs/job-text-parser-modal";
import { MultiPortalSyncBanner } from "@/components/jobs/multi-portal-sync-banner";
import { JobComparisonModal } from "@/components/jobs/job-comparison-modal";
import { JobAlertModal } from "@/components/jobs/job-alert-modal";
import { CommuteRadarCard } from "@/components/jobs/commute-radar-card";
import { JobDismissModal } from "@/components/jobs/job-dismiss-modal";
import { LiveJobSearchModal } from "@/components/jobs/live-job-search-modal";
import { UrlJobScraperCard } from "@/components/jobs/url-job-scraper-card";
import { JobRedFlagsCard } from "@/components/jobs/job-red-flags-card";
import { SalaryTransparencyBadge } from "@/components/jobs/salary-transparency-badge";
import { Globe2 } from "lucide-react";

function matchColor(score: number) {
  if (score >= 75) return "text-success border-success/30 bg-success-soft/40";
  if (score >= 50) return "text-warning border-warning/30 bg-warning-soft/40";
  return "text-muted-foreground border-border bg-surface-hover/30";
}

type SortOption = "SCORE_DESC" | "DATE_DESC" | "COMPANY_ASC";

export default function JobsPage() {
  const [viewMode, setViewMode] = useState<"ACTIVE" | "DISMISSED">("ACTIVE");

  const apiUrl = viewMode === "DISMISSED" ? "/api/jobs?dismissedOnly=true" : "/api/jobs";
  const { data: jobs, isLoading, mutate: mutateJobs } = useSWR<JobPostingWithCompany[]>(apiUrl, fetcher);
  const { data: allActive, mutate: mutateActive } = useSWR<JobPostingWithCompany[]>("/api/jobs", fetcher);
  const { data: allDismissed, mutate: mutateDismissed } = useSWR<JobPostingWithCompany[]>("/api/jobs?dismissedOnly=true", fetcher);
  const { data: preferences } = useSWR<PreferencesPublic>("/api/preferences", fetcher);

  const { mutate } = useSWRConfig();
  const toast = useToast();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [portalFilter, setPortalFilter] = useState("ALL");
  const [matchFilter, setMatchFilter] = useState("ALL");
  const [remoteFilter, setRemoteFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("SCORE_DESC");
  // Standardmäßig aktiv: blendet Angebote unterhalb des in den Einstellungen
  // hinterlegten Mindest-Match-Scores aus (Preferences.minMatchScore), damit
  // nur wirklich zum Profil passende Stellen angezeigt werden. Über den
  // Toggle unten jederzeit für den aktuellen Besuch deaktivierbar.
  const [respectThreshold, setRespectThreshold] = useState(true);
  const minMatchScore = preferences?.minMatchScore ?? 0;

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [jobToDismiss, setJobToDismiss] = useState<JobPostingWithCompany | null>(null);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [parserOpen, setParserOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [showCommuteRadar, setShowCommuteRadar] = useState(false);
  const [liveSearchOpen, setLiveSearchOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    let list = [...jobs];

    // Mindest-Match-Score aus den Einstellungen (nur in der Ansicht "Aktive
    // Angebote" relevant — ausgeblendete Angebote sollen weiterhin vollständig
    // einsehbar sein, unabhängig vom Score).
    if (respectThreshold && viewMode === "ACTIVE" && minMatchScore > 0) {
      list = list.filter((j) => (j.matchScore ?? 0) >= minMatchScore);
    }

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
  }, [jobs, portalFilter, matchFilter, remoteFilter, searchQuery, sortBy, respectThreshold, viewMode, minMatchScore]);

  const belowThresholdCount = useMemo(() => {
    if (!jobs || minMatchScore <= 0) return 0;
    return jobs.filter((j) => (j.matchScore ?? 0) < minMatchScore).length;
  }, [jobs, minMatchScore]);

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

  async function handleRestore(jobId: string) {
    setRestoringId(jobId);
    try {
      await apiPost(`/api/jobs/${jobId}/restore`, undefined);
      await Promise.all([
        mutateJobs(),
        mutateActive(),
        mutateDismissed(),
      ]);
      toast.success("Stellenangebot wiederhergestellt.");
    } catch {
      toast.error("Wiederherstellen fehlgeschlagen.");
    } finally {
      setRestoringId(null);
    }
  }

  function openDismissModal(job: JobPostingWithCompany) {
    setJobToDismiss(job);
    setDismissModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobsuche & Live-Stellenportal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatisch aggregierte Stellenangebote von allen großen Portalen, abgeglichen mit deinem Entwicklerprofil und deinen Ausschluss-Kriterien.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setLiveSearchOpen(true)}
            className="shadow-sm"
          >
            <Globe2 className="h-4 w-4 mr-1.5" /> Live-Jobsuche (APIs)
          </Button>

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

      {/* URL Job Scraper Card */}
      <UrlJobScraperCard
        onJobImported={async () => {
          await Promise.all([mutateJobs(), mutateActive()]);
        }}
      />

      {/* Multi-Portal Sync Banner */}
      <MultiPortalSyncBanner
        jobs={jobs ?? []}
        onSyncComplete={async () => {
          await Promise.all([
            mutateJobs(),
            mutateActive(),
            mutateDismissed(),
          ]);
        }}
      />

      {/* NRW & Remote Pendel-Radar Card */}
      {showCommuteRadar && <CommuteRadarCard />}

      {/* Ansicht-Umschalter: Aktive vs. Ausgeblendete Angebote */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-hover/60 border border-border/60">
          <button
            type="button"
            onClick={() => setViewMode("ACTIVE")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              viewMode === "ACTIVE"
                ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Aktive Angebote</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                viewMode === "ACTIVE" ? "bg-primary text-white" : "bg-surface-hover text-muted-foreground"
              )}
            >
              {allActive?.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("DISMISSED")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
              viewMode === "DISMISSED"
                ? "bg-surface text-rose-500 shadow-sm ring-1 ring-rose-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Ausgeblendete Angebote</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                viewMode === "DISMISSED" ? "bg-rose-500 text-white" : "bg-surface-hover text-muted-foreground"
              )}
            >
              {allDismissed?.length ?? 0}
            </span>
          </button>
        </div>

        {viewMode === "ACTIVE" && (allDismissed?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 font-medium border border-emerald-500/20">
              <Sparkles className="h-3 w-3" />
              {allDismissed?.length} unpassende Angebote gefiltert
            </span>
            <Link href="/settings" className="text-primary hover:underline font-medium">
              Blacklist verwalten →
            </Link>
          </div>
        )}
      </div>

      {/* Mindest-Match-Score-Hinweis & Toggle */}
      {viewMode === "ACTIVE" && minMatchScore > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary-soft/20 p-3">
          <span className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" />
            Nur Angebote mit Match-Score ≥ {minMatchScore}% werden angezeigt
            {belowThresholdCount > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                {belowThresholdCount} unpassende ausgeblendet
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setRespectThreshold(!respectThreshold)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {respectThreshold ? "Trotzdem alle anzeigen" : "Filter wieder aktivieren"}
          </button>
        </div>
      )}

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
          {filtered.length} von {jobs?.length ?? 0} Angeboten {viewMode === "DISMISSED" ? "(ausgeblendet)" : ""}
        </span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Stellenangebote …</p>}
      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">
            {viewMode === "DISMISSED"
              ? "Keine ausgeblendeten Stellenangebote vorhanden."
              : "Keine Stellenangebote für diese Filterauswahl gefunden."}
          </p>
          <p className="mt-1 text-xs">
            {viewMode === "DISMISSED"
              ? "Hier erscheinen Angebote, die du als unpassend markiert hast."
              : "Klicke oben auf „Jetzt alle Portale abgleichen“ oder setze die Filter zurück."}
          </p>
        </div>
      )}

      {/* Grid der Stellenanzeigen */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <Card
            key={job.id}
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
                    onClick={() => openDismissModal(job)}
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
                  onClick={() => handleRestore(job.id)}
                  disabled={restoringId === job.id}
                  className="h-8 text-xs card-hover-effect"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  <span>{restoringId === job.id ? "Wird aktiviert …" : "Wiederherstellen"}</span>
                </Button>
              ) : (
                <Button size="sm" onClick={() => handleApply(job.id)} disabled={applyingId === job.id} className="card-hover-effect">
                  <Send className="h-3.5 w-3.5 text-white" />
                  <span>{applyingId === job.id ? "Wird angelegt …" : "Direkt bewerben"}</span>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Matching-Präferenzen, Wunschgehalt und Blacklist-Kriterien können jederzeit unter{" "}
        <Link href="/settings" className="text-primary font-semibold hover:underline">
          Einstellungen
        </Link>{" "}
        angepasst werden.
      </p>

      {/* Modale */}
      <JobDismissModal
        job={jobToDismiss}
        open={dismissModalOpen}
        onClose={() => {
          setDismissModalOpen(false);
          setJobToDismiss(null);
        }}
        onDismissed={() => {
          mutateJobs();
          mutateActive();
          mutateDismissed();
        }}
      />
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
      <LiveJobSearchModal
        open={liveSearchOpen}
        onClose={() => setLiveSearchOpen(false)}
        onJobAdded={() => {
          mutateJobs();
          mutateActive();
        }}
      />
    </div>
  );
}
