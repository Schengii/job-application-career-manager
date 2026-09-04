import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import Link from "next/link";
import { Pencil, X, Globe, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { apiPatch } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "@/components/status-badge";
import { COMPANY_STATUSES } from "@/lib/core/constants";
import { parseTags, getTagStyle } from "@/lib/core/tags";
import type { Company } from "@/types";

export function CompanyInfoCard({ company, onSaved }: { company: Company; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [form, setForm] = useState({
    name: company.name,
    street: company.street ?? "",
    postalCode: company.postalCode ?? "",
    city: company.city ?? "",
    website: company.website ?? "",
    contactName: company.contactName ?? "",
    contactEmail: company.contactEmail ?? "",
    contactPhone: company.contactPhone ?? "",
    status: company.status,
    tags: company.tags ?? "",
    notes: company.notes ?? "",
    letterTemplate: company.letterTemplate ?? "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPatch(`/api/companies/${company.id}`, form);
      await mutate("/api/companies");
      onSaved();
      toast.success("Unternehmen wurde aktualisiert.");
      setEditing(false);
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  const tagsList = parseTags(company.tags);

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unternehmen bearbeiten</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)} aria-label="Bearbeiten abbrechen">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Field label="Name" htmlFor="c-name" required>
              <Input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Straße & Hausnummer" htmlFor="c-street">
              <Input id="c-street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="PLZ" htmlFor="c-plz">
                <Input id="c-plz" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              </Field>
              <Field label="Stadt" htmlFor="c-city">
                <Input id="c-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
            </div>
            <Field label="Website" htmlFor="c-website">
              <Input id="c-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </Field>
            <Field label="Ansprechpartner" htmlFor="c-contact">
              <Input id="c-contact" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="E-Mail" htmlFor="c-email">
                <Input id="c-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </Field>
              <Field label="Telefon" htmlFor="c-phone">
                <Input id="c-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </Field>
            </div>
            <Field label="Status" htmlFor="c-status">
              <Select id="c-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {COMPANY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tags (kommasepariert)" htmlFor="c-tags">
              <Input id="c-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="z. B. Startup, Bonn, Remote" />
            </Field>
            <Field label="Notizen" htmlFor="c-notes">
              <Textarea id="c-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </Field>
            <Field
              label="Eigener Einleitungssatz fürs Anschreiben"
              htmlFor="c-letter-template"
              hint="Ersetzt beim Generieren nur den Einleitungssatz (der feste Haupttext aus den Einstellungen bleibt unverändert). Leer lassen für den Standard-Einleitungssatz."
            >
              <Textarea
                id="c-letter-template"
                value={form.letterTemplate}
                onChange={(e) => setForm({ ...form, letterTemplate: e.target.value })}
                rows={3}
                placeholder='z. B. "Ihre Mission, nachhaltige Software für den Mittelstand zu bauen, hat mich sofort überzeugt, mich bei [Unternehmen] als … zu bewerben"'
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Speichere …" : "Speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unternehmen</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Unternehmen bearbeiten">
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-4 text-sm">
        <div>
          <Link href={`/companies/${company.id}`} className="font-medium text-foreground hover:underline">
            {company.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <CompanyStatusBadge status={company.status} />
            {tagsList.map((t) => (
              <span
                key={t}
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getTagStyle(t)}`}
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {(company.street || company.city) && (
          <p className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {company.street}
              {company.street && <br />}
              {[company.postalCode, company.city].filter(Boolean).join(" ")}
            </span>
          </p>
        )}
        {company.contactName && <p className="text-muted-foreground">Ansprechpartner: {company.contactName}</p>}
        {company.contactEmail && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <a href={`mailto:${company.contactEmail}`} className="hover:underline">
              {company.contactEmail}
            </a>
          </p>
        )}
        {company.contactPhone && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" /> {company.contactPhone}
          </p>
        )}
        {company.website && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4 shrink-0" />
            <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
              {company.website} <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        )}
        {company.notes && <p className="whitespace-pre-wrap rounded-lg bg-surface-hover p-3 text-muted-foreground">{company.notes}</p>}
        {company.letterTemplate && (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
            <Pencil className="h-3 w-3" />
            Eigener Einleitungssatz hinterlegt
          </p>
        )}
      </CardContent>
    </Card>
  );
}
