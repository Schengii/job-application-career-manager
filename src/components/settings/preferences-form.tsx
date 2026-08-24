"use client";

import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { apiPatch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { REMOTE_PREFERENCES } from "@/lib/constants";
import type { PreferencesWithProfile } from "@/types";

export function PreferencesForm({ preferences }: { preferences: PreferencesWithProfile }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: preferences.fullName ?? "",
    email: preferences.email ?? "",
    phone: preferences.phone ?? "",
    street: preferences.street ?? "",
    postalCode: preferences.postalCode ?? "",
    city: preferences.city ?? "",
    desiredRole: preferences.desiredRole,
    techStack: preferences.techStack,
    preferredLocations: preferences.preferredLocations,
    searchRadiusKm: preferences.searchRadiusKm,
    remotePreference: preferences.remotePreference,
    minSalary: preferences.minSalary ?? 0,
    profileSummary: preferences.profileSummary ?? "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPatch("/api/preferences", {
        ...form,
        searchRadiusKm: Number(form.searchRadiusKm),
        minSalary: form.minSalary ? Number(form.minSalary) : null,
      });
      await mutate("/api/preferences");
      await mutate("/api/jobs"); // Match-Scores hängen von den Präferenzen ab
      toast.success("Präferenzen wurden gespeichert.");
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Kontaktdaten (für Anschreiben)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vollständiger Name" htmlFor="p-name">
            <Input id="p-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="E-Mail" htmlFor="p-email">
            <Input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Telefon" htmlFor="p-phone">
            <Input id="p-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Straße & Hausnummer" htmlFor="p-street">
            <Input id="p-street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          </Field>
          <Field label="PLZ" htmlFor="p-plz">
            <Input id="p-plz" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </Field>
          <Field label="Stadt" htmlFor="p-city">
            <Input id="p-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Job-Suchpräferenzen</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Gewünschte Rolle" htmlFor="p-role">
            <Input id="p-role" value={form.desiredRole} onChange={(e) => setForm({ ...form, desiredRole: e.target.value })} />
          </Field>
          <Field label="Bevorzugte Standorte" htmlFor="p-locations" hint="kommagetrennt, z. B. Bonn, Dortmund, Remote">
            <Input
              id="p-locations"
              value={form.preferredLocations}
              onChange={(e) => setForm({ ...form, preferredLocations: e.target.value })}
            />
          </Field>
          <Field label="Suchradius (km)" htmlFor="p-radius">
            <Input
              id="p-radius"
              type="number"
              min={0}
              value={form.searchRadiusKm}
              onChange={(e) => setForm({ ...form, searchRadiusKm: Number(e.target.value) })}
            />
          </Field>
          <Field label="Remote-Präferenz" htmlFor="p-remote">
            <Select id="p-remote" value={form.remotePreference} onChange={(e) => setForm({ ...form, remotePreference: e.target.value })}>
              {REMOTE_PREFERENCES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gewünschtes Mindestgehalt (€/Jahr)" htmlFor="p-salary">
            <Input
              id="p-salary"
              type="number"
              min={0}
              value={form.minSalary}
              onChange={(e) => setForm({ ...form, minSalary: Number(e.target.value) })}
            />
          </Field>
          <Field label="Tech-Stack-Präferenzen" htmlFor="p-tech" hint="kommagetrennt, z. B. TypeScript, React, CSS">
            <Input id="p-tech" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
          </Field>
        </div>
      </section>

      <section>
        <Field label="Kurzprofil (für den Anschreiben-Generator)" htmlFor="p-summary">
          <Textarea
            id="p-summary"
            rows={3}
            value={form.profileSummary}
            onChange={(e) => setForm({ ...form, profileSummary: e.target.value })}
          />
        </Field>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Speichere …" : "Präferenzen speichern"}
        </Button>
      </div>
    </form>
  );
}
