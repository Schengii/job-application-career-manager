"use client";

// -----------------------------------------------------------------------------
// Live-Jobsuche Modal (Bundesagentur für Arbeit & Arbeitnow API)
// -----------------------------------------------------------------------------
import { useState } from "react";
import {
  Search,
  Building2,
  MapPin,
  Globe2,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Check,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";
import type { SimulatedJobPosting } from "@/lib/mockJobPortals";

interface ScoredLiveJob extends SimulatedJobPosting {
  matchScore: number;
  isBlacklisted?: boolean;
}

interface LiveJobSearchModalProps {
  open: boolean;
  onClose: () => void;
  onJobAdded: () => void;
}

export function LiveJobSearchModal({ open, onClose, onJobAdded }: LiveJobSearchModalProps) {
  const toast = useToast();
  const [query, setQuery] = useState("Fachinformatiker Anwendungsentwicklung");
  const [location, setLocation] = useState("Bonn");
  const [radius, setRadius] = useState(50);
  const [source, setSource] = useState<"ALL" | "ARBEITSAGENTUR" | "ARBEITNOW">("ALL");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScoredLiveJob[]>([]);
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await apiPost<{
        success: boolean;
        jobs: ScoredLiveJob[];
        totalFound: number;
        sourcesQueried: string[];
      }>("/api/jobs/live-search", {
        query,
        location,
        radius: Number(radius),
        source,
        limit: 25,
      });

      setResults(res.jobs || []);
      setSearched(true);
      if ((res.jobs || []).length === 0) {
        toast.info("Keine passenden Stellenangebote im Umkreis gefunden.");
      }
    } catch {
      toast.error("Fehler bei der Live-Jobsuche.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddJob(job: ScoredLiveJob) {
    try {
      // 1. Ggf. Company erstellen
      let companyId: string | null = null;
      try {
        const compRes = await apiPost<{ id: string }>("/api/companies", {
          name: job.companyName,
          city: job.location,
          status: "LEAD",
        });
        companyId = compRes.id;
      } catch {
        // Falls Firma bereits existiert
      }

      // 2. JobPosting erstellen
      await apiPost("/api/jobs", {
        title: job.title,
        description: job.description,
        portalSource: job.portalSource || "ARBEITSAGENTUR",
        sourceUrl: job.sourceUrl,
        location: job.location,
        remote: job.remote,
        requirementsProfile: job.requirementsProfile,
        techStack: job.techStack,
        salaryInfo: job.salaryInfo,
        companyName: job.companyName,
        companyId,
      });

      setAddedUrls((prev) => new Set(prev).add(job.sourceUrl));
      toast.success(`"${job.title}" zu deinen Stellenangeboten hinzugefügt!`);
      onJobAdded();
    } catch {
      toast.error("Konnte Stelle nicht speichern.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Globe2 className="h-5 w-5 text-primary" /> Echte Live-Jobsuche (Bundesagentur & Arbeitnow)
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Durchsucht die offizielle Bundesagentur für Arbeit API und europäische Tech-Job-APIs nach echten Stellenangeboten.
          </p>
        </DialogHeader>

        {/* Search Controls */}
        <form onSubmit={handleSearch} className="py-4 grid grid-cols-1 gap-3 sm:grid-cols-4 shrink-0 border-b border-border">
          <div className="sm:col-span-2">
            <Input
              label="Suchbegriff / Rolle"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="z. B. React Entwickler"
            />
          </div>
          <div>
            <Input
              label="Standort / Region"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bonn, Dortmund ..."
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="w-full">
              <Select
                label="Quelle"
                value={source}
                onChange={(e) => setSource(e.target.value as "ALL" | "ARBEITSAGENTUR" | "ARBEITNOW")}
                options={[
                  { value: "ALL", label: "Alle Portale" },
                  { value: "ARBEITSAGENTUR", label: "Arbeitsagentur" },
                  { value: "ARBEITNOW", label: "Arbeitnow (Remote/Tech)" },
                ]}
              />
            </div>
            <Button type="submit" disabled={loading} className="shrink-0 h-9">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />} Suchen
            </Button>
          </div>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {loading && (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Frage Live-APIs der Jobbörsen ab …</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-sm">Keine aktuellen Treffer für diese Suchkriterien.</p>
            </div>
          )}

          {!loading && !searched && (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm">Starte die Suche, um Live-Angebote abzurufen.</p>
            </div>
          )}

          {!loading &&
            results.map((job) => {
              const isAdded = addedUrls.has(job.sourceUrl);
              return (
                <div
                  key={job.sourceUrl + job.title}
                  className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 card-hover-effect"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                        {job.title}
                      </span>
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Match: {job.matchScore}%
                      </span>
                      {job.remote && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Remote / Home-Office
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {job.companyName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {job.location}
                      </span>
                      <span className="text-primary font-medium">{job.portalSource}</span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {job.description}
                    </p>

                    {job.techStack && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.techStack.split(",").map((tech) => (
                          <span
                            key={tech}
                            className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-end gap-2 shrink-0">
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Originalanzeige <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      size="sm"
                      variant={isAdded ? "outline" : "primary"}
                      onClick={() => handleAddJob(job)}
                      disabled={isAdded}
                      className="h-8 text-xs"
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Übernommen
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-3.5 w-3.5 mr-1" /> Übernehmen
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
