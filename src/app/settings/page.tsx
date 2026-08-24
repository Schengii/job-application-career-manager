"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { PreferencesWithProfile } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { EducationProjectsManager } from "@/components/settings/education-projects-manager";
import { DocumentsManager } from "@/components/settings/documents-manager";
import { BackupManager } from "@/components/settings/backup-manager";
import { MatchingWeightsCard } from "@/components/settings/matching-weights-card";

const TABS = [
  { id: "preferences", label: "Profil & Präferenzen" },
  { id: "education", label: "Ausbildung & Projekte" },
  { id: "documents", label: "Dokumente" },
  { id: "backup", label: "Backup & Daten" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const { data: preferences, isLoading } = useSWR<PreferencesWithProfile>("/api/preferences", fetcher);
  const [tab, setTab] = useState<TabId>("preferences");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Job-Suchpräferenzen, Ausbildungsdaten, Projekte, Unterlagen und Datensicherung zentral verwalten.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border" role="tablist" aria-label="Einstellungsbereiche">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Einstellungen …</p>}

      {preferences && (
        <>
          {tab === "preferences" && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-5">
                  <PreferencesForm preferences={preferences} />
                </CardContent>
              </Card>
              <MatchingWeightsCard />
            </div>
          )}
          {tab === "education" && <EducationProjectsManager preferences={preferences} />}
          {tab === "documents" && <DocumentsManager />}
          {tab === "backup" && <BackupManager />}
        </>
      )}
    </div>
  );
}
