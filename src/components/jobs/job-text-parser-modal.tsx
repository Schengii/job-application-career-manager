"use client";

// -----------------------------------------------------------------------------
// Stellenanzeigen-Schnellerfassung per Rohtext / Job-Parser Modal
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { Sparkles, X, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Input, Field, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { fetcher, apiPost } from "@/lib/core/api";
import { parseJobText, ParsedJob } from "@/lib/jobs/jobParser";
import { computeMatchScore } from "@/lib/jobs/matching";
import { JOB_PORTALS } from "@/lib/core/constants";
import type { PreferencesWithProfile } from "@/types";

export function JobTextParserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const { data: preferences } = useSWR<PreferencesWithProfile>("/api/preferences", fetcher);

  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedJob | null>(null);
  const [portalSource, setPortalSource] = useState("OTHER");
  const [saving, setSaving] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);

  if (!open) return null;

  function handleParse() {
    if (!rawText.trim()) {
      toast.error("Bitte füge zuerst den Text einer Stellenanzeige ein.");
      return;
    }
    const result = parseJobText(rawText);
    setParsed(result);

    if (preferences) {
      const score = computeMatchScore({
        job: {
          title: result.title,
          description: result.description,
          location: result.location,
          remote: result.remote,
          requirementsProfile: result.requirementsProfile,
          techStack: result.techStack.join(","),
        },
        preferences: {
          techStack: preferences.techStack,
          preferredLocations: preferences.preferredLocations,
          remotePreference: preferences.remotePreference,
          desiredRole: preferences.desiredRole,
        },
      });
      setCalculatedScore(score);
    }
    toast.success("Stellenanzeige erfolgreich analysiert.");
  }

  async function handleSaveJob(directApply = false) {
    if (!parsed) return;
    setSaving(true);
    try {
      // 1. Job anlegen (inkl. automatischem Company-Upsert im API-Endpunkt)
      const createdJob = await apiPost<{ id: string }>("/api/jobs", {
        title: parsed.title,
        description: parsed.description,
        portalSource,
        location: parsed.location,
        remote: parsed.remote,
        techStack: parsed.techStack.join(","),
        requirementsProfile: parsed.requirementsProfile,
        salaryInfo: parsed.salaryInfo,
        matchScore: calculatedScore ?? undefined,
        companyName: parsed.companyName,
      });

      await mutate("/api/jobs");

      if (directApply) {
        // Direkt bewerben
        const app = await apiPost<{ id: string }>(`/api/jobs/${createdJob.id}/apply`, undefined);
        await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
        toast.success("Stelle gespeichert & Bewerbung als Entwurf angelegt.");
        onClose();
        router.push(`/applications/${app.id}`);
      } else {
        toast.success("Stellenangebot gespeichert.");
        onClose();
      }
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Stellenanzeigen-Schnellerfassung (Smart Parser)
              </h2>
              <p className="text-xs text-muted-foreground">
                Kopiere den Text einer Anzeige von LinkedIn, Stepstone oder E-Mail hier hinein.
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

        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-5">
          {!parsed ? (
            <div className="space-y-4">
              <Field label="Ausschreibungstext (Copy & Paste)" htmlFor="raw-job-text">
                <Textarea
                  id="raw-job-text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Füge hier den gesamten Text oder Abschnitte der Stellenanzeige ein …"
                  rows={12}
                />
              </Field>

              <div className="flex justify-end">
                <Button type="button" onClick={handleParse}>
                  <Sparkles className="h-4 w-4" /> Text analysieren & Felder erkennen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {calculatedScore !== null && (
                <div className="flex items-center justify-between rounded-lg bg-primary-soft p-3 text-primary">
                  <span className="text-sm font-medium">Berechneter Match-Score mit deinem Profil:</span>
                  <span className="text-lg font-bold">{calculatedScore}%</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Jobtitel" htmlFor="parsed-title" required>
                  <Input
                    id="parsed-title"
                    value={parsed.title}
                    onChange={(e) => setParsed({ ...parsed, title: e.target.value })}
                  />
                </Field>
                <Field label="Unternehmen" htmlFor="parsed-company" required>
                  <Input
                    id="parsed-company"
                    value={parsed.companyName}
                    onChange={(e) => setParsed({ ...parsed, companyName: e.target.value })}
                  />
                </Field>
                <Field label="Ort / Region" htmlFor="parsed-location">
                  <Input
                    id="parsed-location"
                    value={parsed.location ?? ""}
                    onChange={(e) => setParsed({ ...parsed, location: e.target.value })}
                  />
                </Field>
                <Field label="Quelle / Portal" htmlFor="parsed-portal">
                  <Select
                    id="parsed-portal"
                    value={portalSource}
                    onChange={(e) => setPortalSource(e.target.value)}
                  >
                    {JOB_PORTALS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="parsed-remote"
                  checked={parsed.remote}
                  onChange={(e) => setParsed({ ...parsed, remote: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="parsed-remote" className="text-sm text-foreground">
                  Remote / Home-Office möglich
                </label>
              </div>

              {parsed.techStack.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Erkannter Tech-Stack</label>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {parsed.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-primary font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {parsed.requirementsProfile && (
                <Field label="Erkanntes Anforderungsprofil" htmlFor="parsed-req">
                  <Input
                    id="parsed-req"
                    value={parsed.requirementsProfile}
                    onChange={(e) => setParsed({ ...parsed, requirementsProfile: e.target.value })}
                  />
                </Field>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setParsed(null)}>
                  ← Zurück zum Text
                </Button>
              </div>
            </div>
          )}
        </div>

        {parsed && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 bg-surface-hover/30">
            <Button variant="outline" onClick={() => handleSaveJob(false)} disabled={saving}>
              <Plus className="h-4 w-4" /> Nur als Job speichern
            </Button>
            <Button onClick={() => handleSaveJob(true)} disabled={saving}>
              <Send className="h-4 w-4" /> Speichern & direkt Bewerben
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
