"use client";

// -----------------------------------------------------------------------------
// Dialog zum Anlegen einer neuen Bewerbung. Erlaubt entweder die Auswahl eines
// bestehenden Unternehmens oder das Anlegen eines neuen per Freitext.
// -----------------------------------------------------------------------------
import { useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { fetcher, apiPost } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { CompanyWithCounts, ApplicationListItem } from "@/types";
import { APPLICATION_STATUSES } from "@/lib/constants";

const NEW_COMPANY_VALUE = "__new__";

export function ApplicationFormDialog({
  open,
  onClose,
  defaultCompanyId,
}: {
  open: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
}) {
  const { data: companies } = useSWR<CompanyWithCounts[]>(open ? "/api/companies" : null, fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCompanyId(defaultCompanyId ?? "");
    setNewCompanyName("");
    setPosition("");
    setStatus("DRAFT");
    setNotes("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalCompanyId = companyId;
      if (companyId === NEW_COMPANY_VALUE) {
        const company = await apiPost<CompanyWithCounts>("/api/companies", { name: newCompanyName });
        finalCompanyId = company.id;
      }

      await apiPost<ApplicationListItem>("/api/applications", {
        position,
        status,
        notes: notes || null,
        companyId: finalCompanyId,
      });

      await Promise.all([
        mutate("/api/applications"),
        // Die Tabellenansicht (src/app/applications/page.tsx) liest über einen
        // eigenen, paginierten/gefilterten SWR-Key (`/api/applications?...`,
        // s. tableQueryKey dort) statt aus dem unpaginierten "/api/applications" —
        // der muss hier per Key-Matcher separat revalidiert werden, sonst taucht
        // eine gerade angelegte Bewerbung dort erst nach einem Reload auf (wie
        // beim Statuswechsel in handleStatusChange, s. Kommentar dort).
        mutate((key) => typeof key === "string" && key.startsWith("/api/applications?")),
        mutate("/api/metrics"),
        mutate("/api/companies"),
      ]);
      toast.success("Bewerbung wurde angelegt.");
      reset();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bewerbung konnte nicht angelegt werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Neue Bewerbung anlegen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Unternehmen" htmlFor="app-company" required>
          <Select
            id="app-company"
            required
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="" disabled>
              Unternehmen auswählen …
            </option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_COMPANY_VALUE}>+ Neues Unternehmen anlegen</option>
          </Select>
        </Field>

        {companyId === NEW_COMPANY_VALUE && (
          <Field label="Name des neuen Unternehmens" htmlFor="app-new-company" required>
            <Input
              id="app-new-company"
              required
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="z. B. Musterfirma GmbH"
            />
          </Field>
        )}

        <Field label="Position / Jobtitel" htmlFor="app-position" required>
          <Input
            id="app-position"
            required
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="z. B. Frontend-Entwickler (m/w/d)"
          />
        </Field>

        <Field label="Status" htmlFor="app-status">
          <Select id="app-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notizen" htmlFor="app-notes">
          <Textarea id="app-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionale Notizen …" />
        </Field>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Speichere …" : "Bewerbung anlegen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// Wird auch für Statusänderungen aus der Tabelle heraus genutzt.
export async function quickUpdateStatus(applicationId: string, status: string) {
  return apiPost(`/api/applications/${applicationId}/status`, { status });
}
