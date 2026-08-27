import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { Sparkles, Key, ShieldCheck, X, Ban, Tag, Code2, Plus, Building2 } from "lucide-react";
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
    standardCoverLetterBody: preferences.standardCoverLetterBody ?? "",
    coverLetterOpeningSentence: preferences.coverLetterOpeningSentence ?? "",
    weeklyGoal: preferences.weeklyGoal ?? 5,
    minMatchScore: preferences.minMatchScore ?? 0,
    excludedCompanies: preferences.excludedCompanies ?? "",
    excludedKeywords: preferences.excludedKeywords ?? "",
    excludedTechStack: preferences.excludedTechStack ?? "",
    aiProvider: preferences.aiProvider ?? "openai",
    aiModel: preferences.aiModel ?? "",
  });

  const [newCompanyInput, setNewCompanyInput] = useState("");
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [newTechInput, setNewTechInput] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        searchRadiusKm: Number(form.searchRadiusKm),
        minSalary: form.minSalary ? Number(form.minSalary) : null,
        weeklyGoal: Number(form.weeklyGoal) || 5,
        minMatchScore: Number(form.minMatchScore) || 0,
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

  function removeCompany(item: string) {
    const list = form.excludedCompanies.split(",").map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== item.toLowerCase());
    setForm({ ...form, excludedCompanies: list.join(",") });
  }

  function addCompany() {
    const trimmed = newCompanyInput.trim();
    if (!trimmed) return;
    const list = form.excludedCompanies.split(",").map((s) => s.trim()).filter(Boolean);
    if (!list.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      list.push(trimmed);
      setForm({ ...form, excludedCompanies: list.join(",") });
    }
    setNewCompanyInput("");
  }

  function removeKeyword(item: string) {
    const list = form.excludedKeywords.split(",").map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== item.toLowerCase());
    setForm({ ...form, excludedKeywords: list.join(",") });
  }

  function addKeyword() {
    const trimmed = newKeywordInput.trim();
    if (!trimmed) return;
    const list = form.excludedKeywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (!list.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      list.push(trimmed);
      setForm({ ...form, excludedKeywords: list.join(",") });
    }
    setNewKeywordInput("");
  }

  function removeTech(item: string) {
    const list = form.excludedTechStack.split(",").map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== item.toLowerCase());
    setForm({ ...form, excludedTechStack: list.join(",") });
  }

  function addTech() {
    const trimmed = newTechInput.trim();
    if (!trimmed) return;
    const list = form.excludedTechStack.split(",").map((s) => s.trim()).filter(Boolean);
    if (!list.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      list.push(trimmed);
      setForm({ ...form, excludedTechStack: list.join(",") });
    }
    setNewTechInput("");
  }

  const companyList = form.excludedCompanies.split(",").map((s) => s.trim()).filter(Boolean);
  const keywordList = form.excludedKeywords.split(",").map((s) => s.trim()).filter(Boolean);
  const techList = form.excludedTechStack.split(",").map((s) => s.trim()).filter(Boolean);

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
          <Field
            label="Mindest-Match-Score für /jobs (%)"
            htmlFor="p-min-match"
            hint="Stellenangebote darunter werden auf der Jobsuche standardmäßig ausgeblendet (0 = Filter deaktiviert, alle anzeigen)"
          >
            <Input
              id="p-min-match"
              type="number"
              min={0}
              max={100}
              value={form.minMatchScore}
              onChange={(e) => setForm({ ...form, minMatchScore: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Tech-Stack-Präferenzen" htmlFor="p-tech" hint="kommagetrennt, z. B. TypeScript, React, CSS">
              <Input id="p-tech" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
            </Field>
          </div>
        </div>
      </section>

      {/* Ausschluss-Kriterien & Blacklist */}
      <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Ban className="h-4 w-4 text-rose-500" />
            <span>Ausschluss-Kriterien & Blacklist-Filter</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Diese Kriterien werden beim Ausblenden von Jobs gelernt oder können hier manuell gepflegt werden. Sie filtern unpassende Stellenangebote automatisch heraus und werten Match-Scores ab.
          </p>
        </div>

        {/* Blacklist Firmen */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-rose-500" />
            Gesperrte Unternehmen (Blacklist):
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-border/80 bg-surface">
            {companyList.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Keine Unternehmen auf der Blacklist.</span>
            ) : (
              companyList.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCompany(c)}
                    className="hover:text-rose-800 dark:hover:text-rose-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Unternehmen sperren (z. B. 'Firma GmbH') …"
              value={newCompanyInput}
              onChange={(e) => setNewCompanyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCompany();
                }
              }}
              className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="button" size="sm" variant="outline" onClick={addCompany} disabled={!newCompanyInput.trim()} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5" /> Sperren
            </Button>
          </div>
        </div>

        {/* Negative Keywords */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-amber-500" />
            Ausgeschlossene Keywords / Begriffe:
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-border/80 bg-surface">
            {keywordList.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Keine negativen Keywords definiert.</span>
            ) : (
              keywordList.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="hover:text-amber-800 dark:hover:text-amber-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Keyword ausschließen (z. B. 'Senior', 'Zeitarbeit', 'Schicht') …"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="button" size="sm" variant="outline" onClick={addKeyword} disabled={!newKeywordInput.trim()} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5" /> Hinzufügen
            </Button>
          </div>
        </div>

        {/* Ausgeschlossener Tech-Stack */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-indigo-500" />
            Ausgeschlossene Technologien & Frameworks:
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-border/80 bg-surface">
            {techList.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Keine Technologien ausgeschlossen.</span>
            ) : (
              techList.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTech(t)}
                    className="hover:text-indigo-800 dark:hover:text-indigo-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Technologie ausschließen (z. B. 'Wordpress', 'PHP', 'Cobol') …"
              value={newTechInput}
              onChange={(e) => setNewTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech();
                }
              }}
              className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="button" size="sm" variant="outline" onClick={addTech} disabled={!newTechInput.trim()} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5" /> Hinzufügen
            </Button>
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

      {/* Feste Anschreiben-Vorlage: der Haupttext wird bei "Direkt bewerben"
          und jedem generierten Anschreiben unverändert übernommen. Nur
          Empfänger-Adresse, Datum, Anrede und der Einleitungssatz variieren
          pro Bewerbung — der Einleitungssatz wird bei konfiguriertem
          KI-Provider individuell generiert, die Vorlage hier ist der
          Fallback (siehe src/lib/coverLetterGenerator.ts). */}
      <section className="rounded-xl border border-border bg-surface-hover/40 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Building2 className="h-4 w-4 text-primary" />
          <span>Feste Anschreiben-Vorlage</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dieser Text wird bei jeder Bewerbung (inkl. „Direkt bewerben&rdquo; in der Jobsuche) unverändert übernommen.
          Empfänger-Adresse, Datum und Anrede werden automatisch pro Unternehmen angepasst — der Rest bleibt immer gleich.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Der <strong>Einleitungssatz</strong> wird bei konfiguriertem KI-Provider (Abschnitt unten) individuell pro
          Unternehmen formuliert — je mehr Notizen du bei einem Unternehmen hinterlegst (Unternehmens-Detailseite →
          Bearbeiten → Notizen), desto passender wird der Satz. Ohne KI-Provider (oder bei einer Massenaktion über
          viele Bewerbungen) greift stattdessen die feste Vorlage unten.
        </p>
        <Field
          label="Einleitungssatz-Vorlage (Fallback ohne KI)"
          htmlFor="p-opening-sentence"
          hint='Platzhalter {company} und {position} werden automatisch ersetzt, z. B. "mit großem Interesse habe ich Ihre Stellenanzeige für die Position als {position} bei {company} gelesen."'
        >
          <Input
            id="p-opening-sentence"
            value={form.coverLetterOpeningSentence}
            onChange={(e) => setForm({ ...form, coverLetterOpeningSentence: e.target.value })}
            placeholder="mit großem Interesse habe ich Ihre Stellenanzeige für die Position als {position} bei {company} gelesen."
          />
        </Field>
        <Field
          label="Fester Haupttext (Werdegang, Projekt, Abschluss)"
          htmlFor="p-cover-letter-body"
          hint="Wird 1:1 in jedes generierte Anschreiben übernommen, direkt nach dem Einleitungssatz."
        >
          <Textarea
            id="p-cover-letter-body"
            rows={10}
            className="font-mono text-sm leading-relaxed"
            value={form.standardCoverLetterBody}
            onChange={(e) => setForm({ ...form, standardCoverLetterBody: e.target.value })}
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
