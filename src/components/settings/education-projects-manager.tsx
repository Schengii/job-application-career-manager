"use client";

import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { GraduationCap, FolderGit2, Trash2, Plus } from "lucide-react";
import { apiPost, apiDelete } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EDUCATION_TYPES, findStatusMeta } from "@/lib/core/constants";
import type { PreferencesWithProfile } from "@/types";

export function EducationProjectsManager({ preferences }: { preferences: PreferencesWithProfile }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <EducationSection entries={preferences.educationEntries} />
      <ProjectsSection entries={preferences.projectEntries} />
    </div>
  );
}

function EducationSection({ entries }: { entries: PreferencesWithProfile["educationEntries"] }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [form, setForm] = useState({ type: "AUSBILDUNG", title: "", institution: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/api/preferences/education", form);
      await mutate("/api/preferences");
      setForm({ type: "AUSBILDUNG", title: "", institution: "", description: "" });
      toast.success("Eintrag hinzugefügt.");
    } catch {
      toast.error("Hinzufügen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/preferences/education/${id}`);
      await mutate("/api/preferences");
      toast.success("Eintrag gelöscht.");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Ausbildung & Bildungsweg
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
              <div>
                <p className="text-xs font-medium text-primary">{findStatusMeta(EDUCATION_TYPES, entry.type)?.label ?? entry.type}</p>
                <p className="text-sm font-medium text-foreground">{entry.title}</p>
                {entry.institution && <p className="text-xs text-muted-foreground">{entry.institution}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={`${entry.title} löschen`}>
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Typ" htmlFor="edu-type">
              <Select id="edu-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {EDUCATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Institution" htmlFor="edu-institution">
              <Input id="edu-institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            </Field>
          </div>
          <Field label="Titel" htmlFor="edu-title" required>
            <Input
              id="edu-title"
              required
              placeholder="z. B. Elektroniker für Betriebstechnik"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Beschreibung" htmlFor="edu-desc">
            <Textarea id="edu-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Button type="submit" variant="secondary" disabled={saving}>
            <Plus className="h-4 w-4" /> Eintrag hinzufügen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ProjectsSection({ entries }: { entries: PreferencesWithProfile["projectEntries"] }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [form, setForm] = useState({ title: "", description: "", techStack: "", url: "", role: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/api/preferences/projects", form);
      await mutate("/api/preferences");
      setForm({ title: "", description: "", techStack: "", url: "", role: "" });
      toast.success("Projekt hinzugefügt.");
    } catch {
      toast.error("Hinzufügen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/preferences/projects/${id}`);
      await mutate("/api/preferences");
      toast.success("Projekt gelöscht.");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderGit2 className="h-4 w-4" /> Projekte & Referenzen
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{entry.title}</p>
                {entry.techStack && <p className="text-xs text-muted-foreground">{entry.techStack}</p>}
                {entry.description && <p className="mt-1 text-xs text-muted-foreground">{entry.description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={`${entry.title} löschen`}>
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 border-t border-border pt-4">
          <Field label="Titel" htmlFor="proj-title" required>
            <Input
              id="proj-title"
              required
              placeholder="z. B. electroCheck-ai"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tech-Stack" htmlFor="proj-tech">
              <Input id="proj-tech" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
            </Field>
            <Field label="Rolle" htmlFor="proj-role">
              <Input id="proj-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </Field>
          </div>
          <Field label="URL" htmlFor="proj-url">
            <Input id="proj-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </Field>
          <Field label="Beschreibung" htmlFor="proj-desc">
            <Textarea id="proj-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Button type="submit" variant="secondary" disabled={saving}>
            <Plus className="h-4 w-4" /> Projekt hinzufügen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
