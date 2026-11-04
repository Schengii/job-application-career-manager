"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Briefcase, Scale, BellRing, Compass, Globe2 } from "lucide-react";
import { fetcher, apiPost } from "@/lib/core/api";
import type { JobPostingWithCompany, PreferencesPublic } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { JobTextParserModal } from "@/components/jobs/job-text-parser-modal";
import { MultiPortalSyncBanner } from "@/components/jobs/multi-portal-sync-banner";
import { JobComparisonModal } from "@/components/jobs/job-comparison-modal";
import { JobAlertModal } from "@/components/jobs/job-alert-modal";
import { CommuteRadarCard } from "@/components/jobs/commute-radar-card";
import { JobDismissModal } from "@/components/jobs/job-dismiss-modal";
import { LiveJobSearchModal } from "@/components/jobs/live-job-search-modal";
import { UrlJobScraperCard } from "@/components/jobs/url-job-scraper-card";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilterBar } from "@/components/jobs/job-filter-bar";
import { JobsViewSwitcher } from "@/components/jobs/jobs-view-switcher";
import { MinScoreNotice } from "@/components/jobs/min-score-notice";
import {
  DEFAULT_JOB_FILTERS,
  countBelowThreshold,
  filterAndSortJobs,
  type JobFilters,
  type JobViewMode,
} from "@/lib/jobs/jobFilters";

export default function JobsPage() {
  const [viewMode, setViewMode] = useState<JobViewMode>("ACTIVE");

  const apiUrl = viewMode === "DISMISSED" ? "/api/jobs?dismissedOnly=true" : "/api/jobs";
  const { data: jobs, isLoading, mutate: mutateJobs } = useSWR<JobPostingWithCompany[]>(apiUrl, fetcher);
  const { data: allActive, mutate: mutateActive } = useSWR<JobPostingWithCompany[]>("/api/jobs", fetcher);
  const { data: allDismissed, mutate: mutateDismissed } = useSWR<JobPostingWithCompany[]>("/api/jobs?dismissedOnly=true", fetcher);
  const { data: preferences } = useSWR<PreferencesPublic>("/api/preferences", fetcher);

  const { mutate } = useSWRConfig();
  const toast = useToast();
  const router = useRouter();

  const [filters, setFilters] = useState<JobFilters>(DEFAULT_JOB_FILTERS);
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

  const filtered = useMemo(
    () => filterAndSortJobs(jobs, filters, { viewMode, minMatchScore, respectThreshold }),
    [jobs, filters, viewMode, minMatchScore, respectThreshold]
  );

  const belowThresholdCount = useMemo(() => countBelowThreshold(jobs, minMatchScore), [jobs, minMatchScore]);

  function setFilter<K extends keyof JobFilters>(key: K, value: JobFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  /** Setzt alle Filter zurück; die gewählte Sortierung bleibt bewusst erhalten. */
  function resetFilters() {
    setFilters((prev) => ({ ...DEFAULT_JOB_FILTERS, sortBy: prev.sortBy }));
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
      <JobsViewSwitcher
        viewMode={viewMode}
        onChange={setViewMode}
        activeCount={allActive?.length ?? 0}
        dismissedCount={allDismissed?.length ?? 0}
      />

      {/* Mindest-Match-Score-Hinweis & Toggle */}
      {viewMode === "ACTIVE" && minMatchScore > 0 && (
        <MinScoreNotice
          minMatchScore={minMatchScore}
          belowThresholdCount={belowThresholdCount}
          respectThreshold={respectThreshold}
          onToggle={() => setRespectThreshold(!respectThreshold)}
        />
      )}

      {/* Filter- & Suchleiste */}
      <JobFilterBar
        filters={filters}
        setFilter={setFilter}
        onReset={resetFilters}
        viewMode={viewMode}
        shownCount={filtered.length}
        totalCount={jobs?.length ?? 0}
      />

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
          <JobCard
            key={job.id}
            job={job}
            applying={applyingId === job.id}
            restoring={restoringId === job.id}
            onApply={handleApply}
            onRestore={handleRestore}
            onDismiss={openDismissModal}
          />
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
