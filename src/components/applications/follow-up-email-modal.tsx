"use client";

// -----------------------------------------------------------------------------
// Smart Multi-Szenario Nachfass-E-Mail Modal
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { Mail, Copy, X, Clock, CheckCircle2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { generateScenarioFollowUpEmail, FollowUpScenario } from "@/lib/followUp";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import type { PreferencesWithProfile } from "@/types";

const SCENARIOS: { id: FollowUpScenario; label: string; short: string }[] = [
  { id: "AFTER_APPLICATION", label: "Freundliche Nachfrage", short: "7–14 Tage nach Versand" },
  { id: "AFTER_INTERVIEW", label: "Dankes-Mail nach Gespräch", short: "24–48h nach Interview" },
  { id: "AFTER_TECH_TASK", label: "Nach Coding Challenge", short: "4–7 Tage nach Abgabe" },
  { id: "FEEDBACK_REQUEST", label: "Feedback nach Absage", short: "1–3 Tage nach Absage" },
];

export function FollowUpEmailModal({
  open,
  onClose,
  company,
  position,
  applicationId,
  applicationDate,
  onInteractionAdded,
}: {
  open: boolean;
  onClose: () => void;
  company: {
    name: string;
    contactName?: string | null;
    contactEmail?: string | null;
  };
  position: string;
  applicationId?: string;
  applicationDate?: Date | string | null;
  onInteractionAdded?: () => void;
}) {
  const { data: preferences } = useSWR<PreferencesWithProfile>(open ? "/api/preferences" : null, fetcher);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Smart Nachfass-Assistent</h2>
              <p className="text-xs text-muted-foreground">
                Passgenaue E-Mail-Vorlagen für {position} bei {company.name}
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

        {preferences ? (
          <FollowUpEmailContent
            company={company}
            position={position}
            applicationId={applicationId}
            applicationDate={applicationDate}
            preferences={preferences}
            onInteractionAdded={onInteractionAdded}
            onClose={onClose}
          />
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Lade Profildaten …
          </div>
        )}
      </div>
    </div>
  );
}

function FollowUpEmailContent({
  company,
  position,
  applicationId,
  applicationDate,
  preferences,
  onInteractionAdded,
  onClose,
}: {
  company: {
    name: string;
    contactName?: string | null;
    contactEmail?: string | null;
  };
  position: string;
  applicationId?: string;
  applicationDate?: Date | string | null;
  preferences: PreferencesWithProfile;
  onInteractionAdded?: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [activeScenario, setActiveScenario] = useState<FollowUpScenario>("AFTER_APPLICATION");
  const [recordingInteraction, setRecordingInteraction] = useState(false);

  const generated = useMemo(() => {
    return generateScenarioFollowUpEmail({
      scenario: activeScenario,
      companyName: company.name,
      contactName: company.contactName,
      position,
      applicationDate,
      applicantName: preferences.fullName,
      applicantPhone: preferences.phone,
    });
  }, [activeScenario, company, position, applicationDate, preferences]);

  const [subject, setSubject] = useState(generated.subject);
  const [body, setBody] = useState(generated.body);

  // Update text when scenario changes
  function switchScenario(s: FollowUpScenario) {
    setActiveScenario(s);
    const newGen = generateScenarioFollowUpEmail({
      scenario: s,
      companyName: company.name,
      contactName: company.contactName,
      position,
      applicationDate,
      applicantName: preferences.fullName,
      applicantPhone: preferences.phone,
    });
    setSubject(newGen.subject);
    setBody(newGen.body);
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
    toast.success("Nachfass-E-Mail (Betreff + Text) kopiert.");
  }

  function handleOpenMailClient() {
    const recipient = company.contactEmail || "";
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");
  }

  async function handleRecordInteraction() {
    if (!applicationId) return;
    setRecordingInteraction(true);
    try {
      await apiPost(`/api/applications/${applicationId}/interactions`, {
        type: "EMAIL",
        title: `Nachfass-E-Mail: ${generated.scenarioTitle}`,
        summary: `Betreff: ${subject}`,
      });
      toast.success("In Historie als E-Mail-Interaktion vermerkt!");
      if (onInteractionAdded) onInteractionAdded();
      onClose();
    } catch {
      toast.error("Interaktion konnte nicht gespeichert werden.");
    } finally {
      setRecordingInteraction(false);
    }
  }

  return (
    <>
      <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-4">
        {/* Szenario Tabs */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">
            Wähle das passende Nachfass-Szenario:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SCENARIOS.map((s) => {
              const active = activeScenario === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => switchScenario(s.id)}
                  className={`cursor-pointer rounded-lg border p-2.5 transition-all text-xs ${
                    active
                      ? "border-primary bg-primary-soft/30 shadow-xs"
                      : "border-border bg-surface-hover/20 hover:bg-surface-hover/50 text-muted-foreground"
                  }`}
                >
                  <p className={`font-semibold flex items-center gap-1.5 ${active ? "text-primary" : "text-foreground"}`}>
                    {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    {s.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.short}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empfohlenes Timing Hinweis */}
        <div className="flex items-center gap-2 rounded-lg bg-surface-hover/50 px-3 py-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>Empfohlener Zeitpunkt:</strong> {generated.recommendedTiming}
          </span>
        </div>

        {/* Betreff */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Betreff</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Text */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nachricht</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            className="mt-1 text-sm leading-relaxed"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 bg-surface-hover/30">
        <Button variant="outline" size="sm" onClick={handleOpenMailClient}>
          <Mail className="h-4 w-4 mr-1.5 text-sky-500" /> Im E-Mail-Programm öffnen
        </Button>
        <div className="flex items-center gap-2">
          {applicationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecordInteraction}
              disabled={recordingInteraction}
              title="Trägt diese Nachfass-E-Mail automatisch in die Interaktions-Historie ein"
            >
              <History className="h-4 w-4 mr-1 text-primary" />
              In Historie eintragen
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={handleCopyAll}>
            <Copy className="h-4 w-4 mr-1.5" /> Text kopieren
          </Button>
        </div>
      </div>
    </>
  );
}
