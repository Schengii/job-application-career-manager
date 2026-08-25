"use client";

// -----------------------------------------------------------------------------
// Job-URL Scraper & Web-Clipper Card
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Link2, Sparkles, Loader2, Plus, CheckCircle2, AlertTriangle, Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";
import type { SimulatedJobPosting } from "@/lib/mockJobPortals";

interface ScrapedJobResultState extends SimulatedJobPosting {
  matchScore: number;
  isBlacklisted?: boolean;
}

interface UrlJobScraperCardProps {
  onJobImported: () => void;
}

export function UrlJobScraperCard({ onJobImported }: UrlJobScraperCardProps) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrapedJob, setScrapedJob] = useState<ScrapedJobResultState | null>(null);
  const [extractedVia, setExtractedVia] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setScrapedJob(null);
    try {
      const res = await apiPost<{
        success: boolean;
        scrapedJob: ScrapedJobResultState;
        extractedVia: string;
        warnings: string[];
      }>("/api/jobs/scrape-url", { url });

      setScrapedJob(res.scrapedJob);
      setExtractedVia(res.extractedVia);
      toast.success("Stellenanzeige erfolgreich analysiert!");
    } catch {
      toast.error("Fehler beim Abrufen der URL. Bitte prüfe die Adresse.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveJob() {
    if (!scrapedJob) return;
    setSaving(true);
    try {
      // 1. Company anlegen
      let companyId: string | null = null;
      try {
        const comp = await apiPost<{ id: string }>("/api/companies", {
          name: scrapedJob.companyName,
          city: scrapedJob.location,
          status: "LEAD",
        });
        companyId = comp.id;
      } catch {
        // Ignorieren falls existiert
      }

      // 2. Job anlegen
      await apiPost("/api/jobs", {
        ...scrapedJob,
        companyId,
      });

      toast.success(`"${scrapedJob.title}" wurde gespeichert!`);
      setScrapedJob(null);
      setUrl("");
      onJobImported();
    } catch {
      toast.error("Konnte Stelle nicht speichern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-surface to-surface shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Link2 className="h-4 w-4 text-primary" /> Web-Clipper: Beliebige Stellen-URL importieren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleScrape} className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL einfügen (z. B. Stepstone, Indeed, LinkedIn, Karriereseite) …"
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !url.trim()} className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Analysieren
          </Button>
        </form>

        {scrapedJob && (
          <div className="rounded-lg border border-primary/30 bg-surface p-4 animate-scale-in space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-foreground">{scrapedJob.title}</h4>
                  <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Match: {scrapedJob.matchScore}%
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    (Via {extractedVia})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1 font-medium text-foreground/80">
                    <Building2 className="h-3 w-3" /> {scrapedJob.companyName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {scrapedJob.location}
                  </span>
                </div>
              </div>

              <Button size="sm" onClick={handleSaveJob} disabled={saving} className="shrink-0">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                In Jobs übernehmen
              </Button>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">{scrapedJob.description}</p>

            {scrapedJob.techStack && (
              <div className="flex flex-wrap gap-1 pt-1">
                {scrapedJob.techStack.split(",").map((tech) => (
                  <span
                    key={tech}
                    className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
