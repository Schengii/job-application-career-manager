"use client";

import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { Calendar, Video, Tag } from "lucide-react";
import { apiPatch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES, REJECTION_REASONS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";
import { generateIcsContent, downloadIcsFile } from "@/lib/ical";
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nächster Schritt" htmlFor="detail-next-step">
          <Input
            id="detail-next-step"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="z. B. Vorstellungsgespräch am ..."
          />
        </Field>

        <Field label="Meeting-Link (Teams / Zoom / Meet)" htmlFor="detail-meeting">
          <div className="flex gap-2">
            <Input
              id="detail-meeting"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://teams.microsoft.com/..."
            />
            {meetingUrl && (
              <a
                href={meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary-soft px-3 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors shrink-0"
                title="Meeting testen"
              >
                <Video className="h-4 w-4" />
                <span>Join</span>
              </a>
            )}
          </div>
        </Field>
      </div>

      <Field label="Tags & Labels (kommasepariert)" htmlFor="detail-tags">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            id="detail-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="z. B. Prio1, Remote, React19, Empfehlung"
          />
        </div>
      </Field>

      <Field label="Notizen" htmlFor="detail-notes">
        <Textarea id="detail-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {application.nextStepDate ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const ics = generateIcsContent({
                title: `${application.nextStep || "Termin"}: ${application.position} (${application.company.name})`,
                description: `Bewerbung als ${application.position} bei ${application.company.name}\n\nMeeting-Link: ${application.meetingUrl || "Kein Link hinterlegt"}\n\nNotizen:\n${application.notes || "Keine weiteren Notizen"}`,
                location: application.meetingUrl || (application.company.street ? `${application.company.street}, ${application.company.postalCode || ""} ${application.company.city || ""}` : (application.company.city || "Online")),
                url: application.meetingUrl || undefined,
                startDate: new Date(application.nextStepDate!),
              });
              downloadIcsFile(`Termin-${application.company.name}-${application.position}.ics`, ics);
              toast.success("Kalendereintrag (.ics) heruntergeladen.");
            }}
          >
            <Calendar className="h-4 w-4 text-sky-500" /> Termin in Kalender (.ics) exportieren
          </Button>
        ) : (
          <div />
        )}

        <Button type="submit" disabled={saving} className="card-hover-effect">
          {saving ? "Speichere …" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  );
}
