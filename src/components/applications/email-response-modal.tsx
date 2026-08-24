"use client";

// -----------------------------------------------------------------------------
// E-Mail-Rückmeldungs-Assistent Modal
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import useSWR from "swr";
import { Mail, Sparkles, X, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { fetcher, apiPost, apiPatch } from "@/lib/api";
import type { ApplicationListItem } from "@/types";
import { parseEmailResponse } from "@/lib/emailResponseParser";

export function EmailResponseModal({
  open,
  onClose,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const toast = useToast();
  const { data: applications } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);

  const [emailText, setEmailText] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [saving, setSaving] = useState(false);

  const analysis = useMemo(() => {
    if (!emailText.trim()) return null;
    return parseEmailResponse(emailText);
  }, [emailText]);

  // Automatischer Match anhand des Firmennamens
  const autoMatchedAppId = useMemo(() => {
    if (!applications || !emailText) return "";
    const lower = emailText.toLowerCase();
    const match = applications.find((a) => lower.includes(a.company.name.toLowerCase()));
    return match ? match.id : "";
  }, [applications, emailText]);

  const effectiveAppId = selectedAppId || autoMatchedAppId;

  if (!open) return null;

  async function handleApplyStatus() {
    if (!effectiveAppId || !analysis) return;
    setSaving(true);
    try {
      if (analysis.detectedStatus === "INTERVIEW" || analysis.detectedStatus === "REJECTED" || analysis.detectedStatus === "OFFER") {
        await apiPost(`/api/applications/${effectiveAppId}/status`, {
          toStatus: analysis.detectedStatus,
          note: `Automatisch erfasst aus E-Mail-Rückmeldung (${analysis.statusLabel})`,
        });
      }

      // Falls ein Termin extrahiert wurde, im Notizfeld hinterlegen
      if (analysis.extractedDate) {
        await apiPatch(`/api/applications/${effectiveAppId}`, {
          notes: `Gesprächstermin: ${analysis.extractedDate} ${analysis.extractedTime || ""}`.trim(),
        });
      }

      toast.success(`Bewerbung erfolgreich aktualisiert: ${analysis.statusLabel}`);
      onUpdated?.();
      onClose();
    } catch {
      toast.error("Fehler beim Aktualisieren der Bewerbung.");
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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">E-Mail-Rückmeldungs-Assistent</h2>
              <p className="text-xs text-muted-foreground">
                Füge eine empfangene E-Mail ein, um Status & Termine automatisch zu erkennen.
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

        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              E-Mail-Text (z. B. aus Outlook, Gmail oder Webmail einfügen):
            </label>
            <Textarea
              rows={6}
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Sehr geehrter Herr..., vielen Dank für Ihre Bewerbung. Gerne möchten wir Sie zu einem Kennenlerngespräch am 28.08. um 14:00 Uhr einladen..."
              className="mt-1 text-sm leading-relaxed"
            />
          </div>

          {analysis && (
            <div className="rounded-lg border border-border p-4 bg-surface-hover/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" /> Erkannte Rückmeldung:
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-bold ${
                    analysis.detectedStatus === "INTERVIEW" || analysis.detectedStatus === "OFFER"
                      ? "bg-success-soft text-success"
                      : analysis.detectedStatus === "REJECTED"
                      ? "bg-danger-soft text-danger"
                      : "bg-primary-soft text-primary"
                  }`}
                >
                  {analysis.statusLabel}
                </span>
              </div>

              <p className="text-muted-foreground">{analysis.reasoning}</p>

              {(analysis.extractedDate || analysis.extractedTime) && (
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>Erkannter Termin: {analysis.extractedDate} {analysis.extractedTime}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Zugehörige Bewerbung auswählen:
            </label>
            <Select
              value={effectiveAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="mt-1 text-xs font-medium"
            >
              <option value="">Bewerbung auswählen …</option>
              {applications?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company.name} – {a.position} ({a.status})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-hover/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            size="sm"
            onClick={handleApplyStatus}
            disabled={!effectiveAppId || !analysis || analysis.detectedStatus === "UNKNOWN" || saving}
          >
            <Check className="h-4 w-4" /> Status & Notiz aktualisieren
          </Button>
        </div>
      </div>
    </div>
  );
}
