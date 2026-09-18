"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, apiPost, apiDelete } from "@/lib/core/api";
import { CareerProfile } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Layers } from "lucide-react";

export function CareerProfilesCard() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const { data: profiles, isLoading } = useSWR<CareerProfile[]>("/api/profiles", fetcher);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Frontend Developer");
  const [stack, setStack] = useState("TypeScript, React, Next.js, Tailwind");
  const [locations, setLocations] = useState("Bonn, Köln, Remote");
  const [remote, setRemote] = useState<"ONSITE" | "HYBRID" | "REMOTE" | "ANY">("HYBRID");
  const [minSalary, setMinSalary] = useState(48000);
  const [summary, setSummary] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await apiPost("/api/profiles", {
        name: name.trim(),
        desiredRole: role.trim(),
        techStack: stack.trim(),
        preferredLocations: locations.trim(),
        remotePreference: remote,
        minSalary: Number(minSalary) || null,
        profileSummary: summary.trim() || null,
      });

      await mutate("/api/profiles");
      toast.success(`Profil "${name}" erfolgreich angelegt!`);
      setName("");
      setSummary("");
      setCreating(false);
    } catch {
      toast.error("Profil konnte nicht erstellt werden.");
    }
  }

  async function handleActivate(id: string, profileName: string) {
    try {
      await apiPost(`/api/profiles/${id}`, {});
      await mutate("/api/profiles");
      await mutate("/api/preferences");
      toast.success(`Aktives Profil auf "${profileName}" umgeschaltet!`);
    } catch {
      toast.error("Profil konnte nicht aktiviert werden.");
    }
  }

  async function handleDelete(id: string, profileName: string) {
    if (!confirm(`Profil "${profileName}" wirklich löschen?`)) return;
    try {
      await apiDelete(`/api/profiles/${id}`);
      await mutate("/api/profiles");
      toast.success("Profil gelöscht.");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Bewerber-Profile (Multi-Profile Support)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Definiere verschiedene Spezialisierungen (z. B. Frontend vs. Fullstack) und schalte sie mit einem Klick um.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreating(!creating)}
          className="text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> {creating ? "Abbrechen" : "Neues Profil"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {creating && (
          <form onSubmit={handleCreate} className="rounded-xl border border-primary/30 bg-primary-soft/10 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Neues Bewerberprofil anlegen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Profil-Bezeichnung:</label>
                <Input
                  placeholder="z.B. Frontend Specialist (React/TS)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Ziel-Rolle:</label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Fokus Tech-Stack:</label>
              <Input
                value={stack}
                onChange={(e) => setStack(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Orte:</label>
                <Input
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Remote:</label>
                <Select
                  value={remote}
                  onChange={(e) => setRemote(e.target.value as "ONSITE" | "HYBRID" | "REMOTE" | "ANY")}
                  className="text-xs"
                >
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Full Remote</option>
                  <option value="ONSITE">Vor Ort</option>
                  <option value="ANY">Flexibel</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Mindestgehalt (€):</label>
                <Input
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" variant="primary">
                Profil speichern
              </Button>
            </div>
          </form>
        )}

        {/* Profil-Liste */}
        {isLoading && <p className="text-xs text-muted-foreground">Lade Profile …</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles?.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-4 space-y-2 transition-all ${
                p.isDefault
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-surface hover:border-border/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {p.name}
                  {p.isDefault && (
                    <span className="rounded bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 font-semibold">
                      Aktiv
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {!p.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivate(p.id, p.name)}
                      className="h-7 text-xs"
                    >
                      Aktivieren
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(p.id, p.name)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Rolle:</strong> {p.desiredRole}</p>
                <p><strong>Stack:</strong> {p.techStack}</p>
                <p><strong>Präferenzen:</strong> {p.remotePreference} · {p.preferredLocations || "flexibel"}</p>
              </div>
            </div>
          ))}

          {(!profiles || profiles.length === 0) && !isLoading && !creating && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Noch keine alternativen Karriere-Profile angelegt. Klicke auf „Neues Profil“, um verschiedene Rollenprofile zu verwalten.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
