import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { Sparkles, Key, ShieldCheck, X } from "lucide-react";
import { apiPatch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { REMOTE_PREFERENCES, AI_PROVIDERS } from "@/lib/constants";
import type { PreferencesPublic } from "@/types";

export function PreferencesForm({ preferences }: { preferences: PreferencesPublic }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // Sicherheit: `preferences.aiApiKey` ist vom Server immer `null` (siehe
  // `toPublicPreferences`). Ein bereits gespeicherter Key wird dem Nutzer nur
  // über `hasAiApiKey`/`aiApiKeyPreview` angezeigt, nie im Klartext. Das
  // Eingabefeld unten ist daher immer leer und wird nur beim Absenden
  // mitgeschickt, wenn der Nutzer tatsächlich einen neuen Key eintippt.
  const [hasAiApiKey, setHasAiApiKey] = useState(preferences.hasAiApiKey);
  const [aiApiKeyPreview, setAiApiKeyPreview] = useState(preferences.aiApiKeyPreview);
  const [newAiApiKey, setNewAiApiKey] = useState("");

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
    weeklyGoal: preferences.weeklyGoal ?? 5,
    aiProvider: preferences.aiProvider ?? "openai",
    aiModel: preferences.aiModel ?? "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        searchRadiusKm: Number(form.searchRadiusKm),
        minSalary: form.minSalary ? Number(form.minSalary) : null,
        weeklyGoal: Number(form.weeklyGoal) || 5,
        aiModel: form.aiModel || null,
      };
      // `aiApiKey` nur mitschicken, wenn der Nutzer tatsächlich einen neuen
      // Wert eingetippt hat — sonst bleibt der bisherige Key unangetastet
      // (siehe PATCH-Handler in `/api/preferences`).
      if (newAiApiKey.trim()) {
        payload.aiApiKey = newAiApiKey.trim();
      }

      const updated = await apiPatch<PreferencesPublic>("/api/preferences", payload);
      setHasAiApiKey(updated.hasAiApiKey);
      setAiApiKeyPreview(updated.aiApiKeyPreview);
      setNewAiApiKey("");

      await Promise.all([
        mutate("/api/preferences"),
        mutate("/api/jobs"), // Match-Scores hängen von den Präferenzen ab
        mutate("/api/applications"),
      ]);
      toast.success("Präferenzen wurden gespeichert.");
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveApiKey() {
    if (!confirm("API-Key wirklich entfernen? Die App arbeitet danach wieder 100% offline mit Heuristiken.")) return;
    setSaving(true);
    try {
      const updated = await apiPatch<PreferencesPublic>("/api/preferences", { aiApiKey: "" });
      setHasAiApiKey(updated.hasAiApiKey);
      setAiApiKeyPreview(updated.aiApiKeyPreview);
      setNewAiApiKey("");
      toast.success("API-Key wurde entfernt.");
    } catch {
      toast.error("Entfernen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Kontaktdaten (für Anschreiben & Lebenslauf)</h3>
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
        <h3 className="mb-3 text-sm font-semibold text-foreground">Job-Suchpräferenzen & Zielsetzung</h3>
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
          <Field label="Wöchentliches Bewerbungsziel" htmlFor="p-weekly-goal" hint="Bewerbungen pro Woche (für Dashboard-Tracker)">
            <Input
              id="p-weekly-goal"
              type="number"
              min={1}
              max={50}
              value={form.weeklyGoal}
              onChange={(e) => setForm({ ...form, weeklyGoal: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Tech-Stack-Präferenzen" htmlFor="p-tech" hint="kommagetrennt, z. B. TypeScript, React, CSS">
              <Input id="p-tech" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
            </Field>
          </div>
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

      {/* Optionaler KI-Assistent */}
      <section className="rounded-xl border border-primary/25 bg-primary-soft/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Optionale KI-Veredelung (OpenAI / Anthropic / OpenRouter)</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Hinterlege optional deinen eigenen API-Key, um Anschreiben noch individueller mit LLMs zu verfeinern und im Mock-Interview detailliertes Feedback nach der STAR-Methode zu erhalten. 
          <strong> Wenn kein Key hinterlegt ist, arbeitet die App 100% offline und kostenlos mit bewährten Heuristiken.</strong>
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
          <Field label="KI-Provider" htmlFor="p-ai-provider">
            <Select
              id="p-ai-provider"
              value={form.aiProvider}
              onChange={(e) => setForm({ ...form, aiProvider: e.target.value })}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Modell-Name (optional)" htmlFor="p-ai-model" hint="z.B. gpt-4o-mini oder claude-3-5-sonnet">
            <Input
              id="p-ai-model"
              value={form.aiModel}
              onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
              placeholder="Standard-Modell des Providers nutzen"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="API-Key"
              htmlFor="p-ai-key"
              hint="Wird nur lokal in deiner Datenbank gespeichert und nie an den Browser zurückgeschickt"
            >
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  id="p-ai-key"
                  type="password"
                  value={newAiApiKey}
                  onChange={(e) => setNewAiApiKey(e.target.value)}
                  placeholder={hasAiApiKey ? `Hinterlegt (${aiApiKeyPreview}) — zum Ändern neuen Key eingeben` : "sk-..."}
                  autoComplete="off"
                />
                {hasAiApiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveApiKey}
                    disabled={saving}
                    title="Key entfernen"
                    className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {hasAiApiKey && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Ein Key ist hinterlegt ({aiApiKeyPreview}). Aus Sicherheitsgründen wird er nie im Klartext angezeigt.
                </p>
              )}
            </Field>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="card-hover-effect">
          {saving ? "Speichere …" : "Präferenzen speichern"}
        </Button>
      </div>
    </form>
  );
}
