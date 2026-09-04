"use client";

import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { Calendar, Video, Tag, Hourglass } from "lucide-react";
import { apiPatch } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES, REJECTION_REASONS, INTERVIEW_STAGES } from "@/lib/core/constants";
import { toDateInputValue } from "@/lib/core/utils";
import { generateIcsContent, downloadIcsFile } from "@/lib/settings/ical";
import type { ApplicationDetail } from "@/types";

export function ApplicationDetailsForm({
  application,
  onSaved,
}: {
  application: ApplicationDetail;
  onSaved: () => void;
  }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [position, setPosition] = useState(application.position);
  const [status, setStatus] = useState(application.status);
  const [applicationDate, setApplicationDate] = useState(toDateInputValue(application.applicationDate));
  const [nextStep, setNextStep] = useState(application.nextStep ?? "");
  const [nextStepDate, setNextStepDate] = useState(toDateInputValue(application.nextStepDate));
  const [meetingUrl, setMeetingUrl] = useState(application.meetingUrl ?? "");
  const [interviewStage, setInterviewStage] = useState(application.interviewStage ?? "");
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(application.timeSpentMinutes ?? 30);
  const [tags, setTags] = useState(application.tags ?? "");
  const [rejectionReason, setRejectionReason] = useState(application.rejectionReason ?? "");
  const [notes, setNotes] = useState(application.notes ?? "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPatch(`/api/applications/${application.id}`, {
        position,
        status,
        applicationDate: applicationDate ? new Date(applicationDate).toISOString() : "",
        nextStep: nextStep || null,
        nextStepDate: nextStepDate ? new Date(nextStepDate).toISOString() : "",
        meetingUrl: meetingUrl || null,
        interviewStage: interviewStage || null,
        timeSpentMinutes: Number(timeSpentMinutes) || 0,
        tags: tags || null,
        rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
        notes: notes || null,
      });
      await Promise.all([
        mutate("/api/applications"),
        mutate("/api/metrics"),
        mutate("/api/analytics"),
      ]);
      onSaved();
      toast.success("Bewerbung wurde aktualisiert.");
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  function addMinutes(min: number) {
    setTimeSpentMinutes((prev) => Math.max(0, (prev || 0) + min));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Position / Jobtitel" htmlFor="detail-position" required>
          <Input id="detail-position" required value={position} onChange={(e) => setPosition(e.target.value)} />
        </Field>
        <Field label="Status" htmlFor="detail-status">
          <Select id="detail-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bewerbungsdatum" htmlFor="detail-date">
          <Input id="detail-date" type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
        </Field>
        <Field label="Termin nächster Schritt" htmlFor="detail-next-date">
          <Input id="detail-next-date" type="date" value={nextStepDate} onChange={(e) => setNextStepDate(e.target.value)} />
        </Field>
      </div>

      {status === "INTERVIEW" && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2">
          <label className="text-xs font-bold text-primary">Interview-Phase / Stufe:</label>
          <Select
            value={interviewStage}
            onChange={(e) => setInterviewStage(e.target.value)}
            className="text-xs"
          >
            <option value="">Phase auswählen …</option>
            {INTERVIEW_STAGES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {status === "REJECTED" && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-2">
          <label className="text-xs font-bold text-rose-600 dark:text-rose-400">
            Absagegrund erfassen (für Analytics):
          </label>
          <Select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="text-xs"
          >
            <option value="">Grund auswählen …</option>
            {REJECTION_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Zeitaufwand & ROI Logger */}
      <div className="rounded-lg border border-border bg-surface-hover/30 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Hourglass className="h-3.5 w-3.5 text-primary" /> Investierter Zeitaufwand (Minuten):
          </label>
          <span className="text-xs font-bold text-primary">{Math.round((timeSpentMinutes / 60) * 10) / 10} Std.</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            step={5}
            value={timeSpentMinutes}
            onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
            className="h-8 text-xs w-28"
          />
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => addMinutes(15)} className="h-8 px-2 text-[11px]">
              +15m
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addMinutes(30)} className="h-8 px-2 text-[11px]">
              +30m
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addMinutes(60)} className="h-8 px-2 text-[11px]">
              +1h
            </Button>
          </div>
        </div>
      </div>

      <Field label="Nächster Schritt (Beschreibung)" htmlFor="detail-next-step">
        <Input
          id="detail-next-step"
          placeholder="z.B. Technisches Fachgespräch mit Teamleiter, Probearbeitstag..."
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
        />
      </Field>

      <Field label="Meeting-Link / Telefon" htmlFor="detail-meeting-url" hint="Teams, Zoom, Google Meet oder Telefonnummer">
        <div className="relative">
          <Video className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="detail-meeting-url"
            className="pl-8"
            placeholder="https://teams.microsoft.com/... oder https://zoom.us/..."
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
          />
        </div>
      </Field>

      {meetingUrl && nextStepDate && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Interview-Termin im Kalender eintragen</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const ics = generateIcsContent({
                title: `Vorstellungsgespräch: ${application.company.name} – ${application.position}`,
                description: `Interview via ${meetingUrl}\nNotizen: ${notes || "Keine"}`,
                startDate: new Date(nextStepDate),
                location: meetingUrl,
                url: meetingUrl,
              });
              downloadIcsFile(ics, `interview-${application.company.name.toLowerCase().replace(/\s+/g, "-")}.ics`);
              toast.success("Kalendereintrag (.ics) heruntergeladen!");
            }}
          >
            .ics Kalenderdatei
          </Button>
        </div>
      )}

      <Field label="Tags (kommasepariert)" htmlFor="detail-tags" hint="z.B. Prio1, Remote, React19">
        <div className="relative">
          <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input id="detail-tags" className="pl-8" placeholder="Prio1, Frontend, Empfehlung" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </Field>

      <Field label="Notizen & Feedback" htmlFor="detail-notes">
        <Textarea id="detail-notes" rows={3} placeholder="Gesprächsnotizen, Gehaltsangaben, Feedback..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="submit" disabled={saving}>
          {saving ? "Speichern …" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  );
}
