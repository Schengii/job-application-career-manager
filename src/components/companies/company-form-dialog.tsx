"use client";

import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import { COMPANY_STATUSES } from "@/lib/core/constants";
import type { CompanyWithCounts } from "@/types";

const EMPTY = {
  name: "",
  street: "",
  postalCode: "",
  city: "",
  website: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  status: "LEAD",
  notes: "",
};

export function CompanyFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCompany(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anlegen fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  async function createCompany(forceCreate: boolean) {
    const response = await apiPost<
      CompanyWithCounts | { duplicateWarning: true; candidates: { id: string; name: string }[] }
    >("/api/companies", { ...form, forceCreate });

    if ("duplicateWarning" in response) {
      const names = response.candidates.map((c) => c.name).join(", ");
      const proceed = window.confirm(
        `Ähnliches Unternehmen bereits vorhanden: ${names}. Trotzdem "${form.name}" neu anlegen?`
      );
      if (proceed) {
        await createCompany(true);
      }
      return;
    }

    await mutate("/api/companies");
    toast.success("Unternehmen wurde angelegt.");
    setForm(EMPTY);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Neues Unternehmen anlegen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Name" htmlFor="nc-name" required>
          <Input id="nc-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Straße & Hausnummer" htmlFor="nc-street">
          <Input id="nc-street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="PLZ" htmlFor="nc-plz">
            <Input id="nc-plz" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </Field>
          <Field label="Stadt" htmlFor="nc-city">
            <Input id="nc-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
        </div>
        <Field label="Website" htmlFor="nc-website">
          <Input id="nc-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </Field>
        <Field label="Ansprechpartner" htmlFor="nc-contact">
          <Input id="nc-contact" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="E-Mail" htmlFor="nc-email">
            <Input id="nc-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </Field>
          <Field label="Telefon" htmlFor="nc-phone">
            <Input id="nc-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </Field>
        </div>
        <Field label="Status" htmlFor="nc-status">
          <Select id="nc-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {COMPANY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notizen" htmlFor="nc-notes">
          <Textarea id="nc-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Speichere …" : "Unternehmen anlegen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
