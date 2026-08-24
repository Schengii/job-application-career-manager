"use client";

import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { apiPatch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";
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
        notes: notes || null,
      });
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
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

      <Field label="Nächster Schritt" htmlFor="detail-next-step">
        <Input
          id="detail-next-step"
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          placeholder="z. B. Vorstellungsgespräch am ..."
        />
      </Field>

      <Field label="Notizen" htmlFor="detail-notes">
        <Textarea id="detail-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Speichere …" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  );
}
