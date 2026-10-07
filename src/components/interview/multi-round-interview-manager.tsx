"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  Video,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  InterviewRoundData,
  InterviewRoundType,
  InterviewRoundStatus,
  STAGE_CONFIGS,
  createDefaultRound,
} from "@/lib/interview/multiRoundInterviewManager";

interface MultiRoundInterviewManagerProps {
  applicationId: string;
  initialRounds?: InterviewRoundData[];
  onRoundsChange?: (rounds: InterviewRoundData[]) => void;
}

const STORAGE_PREFIX = "career_multi_rounds_";

export function MultiRoundInterviewManager({
  applicationId,
  initialRounds,
  onRoundsChange,
}: MultiRoundInterviewManagerProps) {
  const toast = useToast();
  const storageKey = `${STORAGE_PREFIX}${applicationId}`;

  const [rounds, setRounds] = useState<InterviewRoundData[]>(() => {
    if (initialRounds && initialRounds.length > 0) return initialRounds;
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as InterviewRoundData[];
    } catch {}
    // Standardmäßig mit Stufe 1 starten
    return [createDefaultRound("SCREENING", 1)];
  });

  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(() => rounds[0]?.id ?? null);

  function saveRounds(updated: InterviewRoundData[]) {
    setRounds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    onRoundsChange?.(updated);
  }

  function handleAddRound(stage: InterviewRoundType) {
    const nextNumber = rounds.length + 1;
    const newRound = createDefaultRound(stage, nextNumber);
    const updated = [...rounds, newRound];
    saveRounds(updated);
    setExpandedRoundId(newRound.id);
    toast.success(`Runde ${nextNumber} (${STAGE_CONFIGS[stage].label}) hinzugefügt!`);
  }

  function handleUpdateRound(roundId: string, partial: Partial<InterviewRoundData>) {
    const updated = rounds.map((r) => (r.id === roundId ? { ...r, ...partial } : r));
    saveRounds(updated);
  }

  function handleDeleteRound(roundId: string) {
    if (!confirm("Diese Interview-Runde wirklich entfernen?")) return;
    const updated = rounds.filter((r) => r.id !== roundId).map((r, idx) => ({ ...r, roundNumber: idx + 1 }));
    saveRounds(updated);
    toast.info("Runde entfernt.");
  }

  const getStatusBadge = (status: InterviewRoundStatus) => {
    switch (status) {
      case "PASSED":
        return <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✅ Bestanden</span>;
      case "COMPLETED":
        return <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">🏁 Abgeschlossen</span>;
      case "FEEDBACK_PENDING":
        return <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">⏳ Feedback offen</span>;
      case "REJECTED":
        return <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">❌ Absage nach Runde</span>;
      default:
        return <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">📅 Geplant</span>;
    }
  };

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Mehrstufiger Interview-Manager
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Begleite jede Runde (HR, Coding-Challenge, Tech Deep-Dive, GF) mit Termin, Gesprächspartnern & Checklisten.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Select
              className="h-8 text-xs py-1"
              onChange={(e) => {
                if (e.target.value) {
                  handleAddRound(e.target.value as InterviewRoundType);
                  e.target.value = "";
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>+ Runde hinzufügen …</option>
              <option value="SCREENING">1. HR / Talent Screening</option>
              <option value="CODING_CHALLENGE">2. Coding Challenge / Review</option>
              <option value="TECH_INTERVIEW">3. Tech Deep-Dive & System Design</option>
              <option value="FINAL_ROUND">4. Team Fit & Management</option>
              <option value="OFFER_STAGE">5. Offer & Vertragsprüfung</option>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {rounds.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs">
            Noch keine Interview-Runden eingetragen. Klicke oben auf „+ Runde hinzufügen“.
          </div>
        )}

        {rounds.map((round) => {
          const isExpanded = expandedRoundId === round.id;
          const stageConfig = STAGE_CONFIGS[round.stage];

          return (
            <div
              key={round.id}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? "border-primary/40 bg-primary-soft/10 shadow-xs"
                  : "border-border bg-surface-hover/20 hover:bg-surface-hover/40"
              }`}
            >
              {/* Runde Accordion Header */}
              <div
                className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                onClick={() => setExpandedRoundId(isExpanded ? null : round.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                    {round.roundNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">{round.title}</h4>
                      {getStatusBadge(round.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {round.scheduledAt && (
                        <span className="flex items-center gap-1 text-primary">
                          <Calendar className="h-3 w-3" />
                          {new Date(round.scheduledAt).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} Uhr
                        </span>
                      )}
                      {round.interviewerNames && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {round.interviewerNames}
                        </span>
                      )}
                      <span>⏱️ {round.durationMinutes} min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {round.meetingUrl && (
                    <a
                      href={round.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md text-sky-500 hover:bg-sky-500/10"
                      title="Meeting-Link öffnen"
                    >
                      <Video className="h-4 w-4" />
                    </a>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expandierter Runden-Detailbereich */}
              {isExpanded && (
                <div className="p-4 pt-1 border-t border-border/40 space-y-4 text-xs animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Status der Runde</label>
                      <Select
                        value={round.status}
                        onChange={(e) => handleUpdateRound(round.id, { status: e.target.value as InterviewRoundStatus })}
                        className="h-8 text-xs py-1"
                      >
                        <option value="SCHEDULED">📅 Geplant</option>
                        <option value="PASSED">✅ Bestanden (Nächste Runde)</option>
                        <option value="COMPLETED">🏁 Abgeschlossen</option>
                        <option value="FEEDBACK_PENDING">⏳ Feedback ausstehend</option>
                        <option value="REJECTED">❌ Absage nach dieser Runde</option>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Termin (Datum & Uhrzeit)</label>
                      <Input
                        type="datetime-local"
                        value={round.scheduledAt ? new Date(round.scheduledAt).toISOString().slice(0, 16) : ""}
                        onChange={(e) => handleUpdateRound(round.id, { scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="h-8 text-xs py-1"
                      >
                      </Input>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Dauer (Minuten)</label>
                      <Input
                        type="number"
                        value={round.durationMinutes}
                        onChange={(e) => handleUpdateRound(round.id, { durationMinutes: Number(e.target.value) || 30 })}
                        className="h-8 text-xs py-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Gesprächspartner (Name & Rolle)</label>
                      <Input
                        placeholder="z. B. Dr. Jonas Berg (Lead Architect), Lisa Schmidt (People)"
                        value={round.interviewerNames || ""}
                        onChange={(e) => handleUpdateRound(round.id, { interviewerNames: e.target.value })}
                        className="h-8 text-xs py-1"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Meeting-Link (Zoom / Teams / Meet)</label>
                      <Input
                        placeholder="https://teams.microsoft.com/l/meetup-join/..."
                        value={round.meetingUrl || ""}
                        onChange={(e) => handleUpdateRound(round.id, { meetingUrl: e.target.value })}
                        className="h-8 text-xs py-1"
                      />
                    </div>
                  </div>

                  {/* Stage-spezifische Vorbereitungs-Checkliste */}
                  {stageConfig && (
                    <div className="rounded-lg bg-surface-hover/40 p-3 border border-border/50 space-y-2">
                      <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                        <Sparkles className="h-3 w-3 text-amber-500" /> Vorbereitungs-Fokus für {stageConfig.label}
                      </span>
                      <ul className="space-y-1.5 text-muted-foreground text-[11.5px]">
                        {stageConfig.prepChecklist.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Empfohlene Gegenfragen an das Team */}
                  {stageConfig?.suggestedQuestionsToAsk && stageConfig.suggestedQuestionsToAsk.length > 0 && (
                    <div className="rounded-lg bg-surface-hover/30 p-3 border border-border/40 space-y-1.5">
                      <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                        <HelpCircle className="h-3 w-3 text-sky-500" /> Strategische Gegenfragen an die Interviewer:
                      </span>
                      <ul className="space-y-1 text-muted-foreground text-[11.5px]">
                        {stageConfig.suggestedQuestionsToAsk.map((q, i) => (
                          <li key={i} className="italic text-foreground/90 pl-2 border-l-2 border-sky-500/40">
                            „{q}“
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notizen & Feedback */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Persönliche Vorbereitungsnotizen</label>
                      <Textarea
                        rows={3}
                        placeholder="Wichtige Punkte, Projekt-Zahlen, eigene Schwerpunkte …"
                        value={round.prepNotes || ""}
                        onChange={(e) => handleUpdateRound(round.id, { prepNotes: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Ergebnis & Feedback nach dem Gespräch</label>
                      <Textarea
                        rows={3}
                        placeholder="Wie lief es? Welche Themen wurden besprochen? Nächste Schritte?"
                        value={round.feedbackNotes || ""}
                        onChange={(e) => handleUpdateRound(round.id, { feedbackNotes: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRound(round.id)}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Diese Runde löschen
                    </Button>
                    <span className="text-[11px] text-muted-foreground italic">
                      Änderungen werden automatisch gespeichert.
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
