"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  Users,
  MessageSquare,
  FileText,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { formatDateTime, formatDate, cn } from "@/lib/core/utils";
import type { ApplicationStatusEvent, ApplicationInteraction } from "@/types";
import { Button } from "@/components/ui/button";
import { INTERACTION_TYPES, InteractionType } from "@/lib/core/constants";
import { apiPost, apiDelete } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";

const STATUS_DOT_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-400 ring-4 ring-slate-400/20",
  SENT: "bg-amber-500 ring-4 ring-amber-500/20",
  INTERVIEW: "bg-sky-500 ring-4 ring-sky-500/20",
  OFFER: "bg-emerald-500 ring-4 ring-emerald-500/20",
  REJECTED: "bg-rose-500 ring-4 ring-rose-500/20",
  WITHDRAWN: "bg-gray-400 ring-4 ring-gray-400/20",
};

const INTERACTION_ICON_MAP: Record<string, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  INTERVIEW_ROUND: Users,
  FEEDBACK: MessageSquare,
  NOTE: FileText,
};

type TimelineItem =
  | { type: "STATUS"; date: Date; data: ApplicationStatusEvent }
  | { type: "INTERACTION"; date: Date; data: ApplicationInteraction };

export function StatusTimeline({
  applicationId,
  events,
  interactions = [],
  onChanged,
}: {
  applicationId?: string;
  events: ApplicationStatusEvent[];
  interactions?: ApplicationInteraction[];
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<InteractionType>("CALL");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [interactionDate, setInteractionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

  // Kombiniere Status-Events und Interaktionen chronologisch sortiert (neueste zuerst)
  const items: TimelineItem[] = [
    ...events.map((e) => ({
      type: "STATUS" as const,
      date: new Date(e.changedAt),
      data: e,
    })),
    ...interactions.map((i) => ({
      type: "INTERACTION" as const,
      date: new Date(i.interactionDate || i.createdAt),
      data: i,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  async function handleAddInteraction(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId || !title.trim()) return;

    setSaving(true);
    try {
      await apiPost(`/api/applications/${applicationId}/interactions`, {
        type: interactionType,
        title: title.trim(),
        summary: summary.trim() || undefined,
        interactionDate: interactionDate ? new Date(interactionDate).toISOString() : undefined,
      });
      toast.success("Interaktion hinzugefügt.");
      setTitle("");
      setSummary("");
      setAddModalOpen(false);
      onChanged?.();
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteInteraction(interactionId: string) {
    if (!applicationId || !confirm("Interaktion löschen?")) return;
    try {
      await apiDelete(`/api/applications/${applicationId}/interactions?interactionId=${interactionId}`);
      toast.success("Interaktion gelöscht.");
      onChanged?.();
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  }

  return (
    <div className="space-y-4">
      {applicationId && (
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chronologie & Aktivitäten
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddModalOpen(true)}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Aktivität erfassen</span>
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Ereignisse protokolliert.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item, idx) => {
            if (item.type === "STATUS") {
              const event = item.data;
              const dotColor =
                STATUS_DOT_COLORS[event.status] || "bg-primary ring-4 ring-primary/20";

              return (
                <li key={`status-${event.id}`} className="relative flex gap-3.5 pl-1">
                  <div className="flex flex-col items-center pt-1">
                    <span className={cn("h-3 w-3 rounded-full shrink-0", dotColor)} />
                    {idx < items.length - 1 && <span className="mt-2 w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="pb-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ApplicationStatusBadge status={event.status} />
                    </div>
                    {event.note && (
                      <p className="mt-1.5 text-xs text-foreground bg-surface-hover/50 p-2 rounded-lg border border-border/50">
                        {event.note}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(event.changedAt)}
                    </p>
                  </div>
                </li>
              );
            }

            // INTERACTION item
            const interaction = item.data;
            const Icon = INTERACTION_ICON_MAP[interaction.type] || FileText;

            return (
              <li key={`interaction-${interaction.id}`} className="relative flex gap-3.5 pl-1">
                <div className="flex flex-col items-center pt-0.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary border border-primary/30 shadow-2xs">
                    <Icon className="h-3 w-3" />
                  </div>
                  {idx < items.length - 1 && <span className="mt-2 w-0.5 flex-1 bg-border" />}
                </div>
                <div className="pb-2 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">{interaction.title}</p>
                      <span className="inline-block text-[10px] uppercase font-semibold text-primary">
                        {INTERACTION_TYPES.find((t) => t.value === interaction.type)?.label ||
                          interaction.type}
                      </span>
                    </div>
                    {applicationId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteInteraction(interaction.id)}
                        className="rounded p-1 text-muted-foreground hover:text-danger hover:bg-surface-hover transition-colors"
                        title="Eintrag löschen"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {interaction.summary && (
                    <p className="mt-1 text-xs text-muted-foreground bg-surface-hover/40 p-2 rounded-lg border border-border/40 whitespace-pre-wrap">
                      {interaction.summary}
                    </p>
                  )}

                  <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(interaction.interactionDate)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Modal: Aktivität erfassen */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground">Interaktion / Aktivität erfassen</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Dokumentiere Telefonate, E-Mails oder Feedback-Gespräche zu dieser Bewerbung.
            </p>

            <form onSubmit={handleAddInteraction} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Typ:</label>
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value as InteractionType)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {INTERACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Titel / Anlass:</label>
                <input
                  type="text"
                  placeholder="z.B. Kennenlern-Telefonat mit Recruiter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Datum:</label>
                <input
                  type="date"
                  value={interactionDate}
                  onChange={(e) => setInteractionDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Notizen & Details (optional):</label>
                <textarea
                  rows={3}
                  placeholder="Besprochene Punkte, Gehaltsrahmen, nächster Schritt …"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
                  Abbrechen
                </Button>
                <Button size="sm" type="submit" disabled={saving}>
                  {saving ? "Speichern …" : "Speichern"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
