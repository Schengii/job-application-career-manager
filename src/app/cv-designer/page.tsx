"use client";

import { useState, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { Printer, FileText, CheckSquare, Settings, FileCode, Sparkles, ArrowUpDown, ChevronUp, ChevronDown, BookOpen } from "lucide-react";
import { fetcher } from "@/lib/core/api";
import type { PreferencesWithProfile, ApplicationListItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CvLayout, CvSection, generateCvHtml } from "@/lib/documents/cvGenerator";
import { generateProjectPortfolioHtml } from "@/lib/documents/portfolioPdfGenerator";
import { AtsScoreCard } from "@/components/cv/ats-score-card";
import { JsonResumeModal } from "@/components/cv/json-resume-modal";
import { CvTailorModal } from "@/components/cv/cv-tailor-modal";
import { CoverLetterAbCard } from "@/components/cv/cover-letter-ab-card";

export default function CvDesignerPage() {
  const { data: preferences, isLoading } = useSWR<PreferencesWithProfile>("/api/preferences", fetcher);
  const { data: applications } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  const { mutate } = useSWRConfig();

  const [layout, setLayout] = useState<CvLayout>("MODERN");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [sectionOrder, setSectionOrder] = useState<CvSection[]>([
    "PROFILE",
    "EDUCATION",
    "PROJECTS",
    "SKILLS",
  ]);
  const [initialized, setInitialized] = useState(false);
  const [jsonResumeOpen, setJsonResumeOpen] = useState(false);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);

  // Initial alle Projekte & Ausbildungselemente aktivieren
  if (preferences && !initialized) {
    setSelectedProjects(preferences.projectEntries.map((p) => p.id));
    setSelectedEducation(preferences.educationEntries.map((e) => e.id));
    setInitialized(true);
  }

  const cvHtml = useMemo(() => {
    if (!preferences) return "";
    return generateCvHtml(preferences, {
      layout,
      selectedProjectIds: selectedProjects,
      selectedEducationIds: selectedEducation,
      sectionOrder,
    });
  }, [preferences, layout, selectedProjects, selectedEducation, sectionOrder]);

  function moveSection(index: number, direction: "UP" | "DOWN") {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const nextOrder = [...sectionOrder];
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[targetIndex];
    nextOrder[targetIndex] = temp;
    setSectionOrder(nextOrder);
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(cvHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function toggleProject(id: string) {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleEducation(id: string) {
    setSelectedEducation((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Lade Profil- und Lebenslaufdaten …</p>;
  }

  if (!preferences) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Keine Profildaten vorhanden.</p>
        <Link href="/settings">
          <Button size="sm" className="mt-4">
            Zu den Einstellungen
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lebenslauf-Generator & CV-Designer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Erstelle einen strukturierten, druckoptimierten Lebenslauf direkt aus deinen hinterlegten Daten.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!preferences) return;
              const html = generateProjectPortfolioHtml(preferences);
              const win = window.open("", "_blank");
              if (win) {
                win.document.write(html);
                win.document.close();
                win.focus();
                setTimeout(() => win.print(), 350);
              }
            }}
            className="card-hover-effect border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
            title="Druckfertiges DIN-A4 Praxis-Portfolio aller Referenzprojekte erzeugen"
          >
            <BookOpen className="h-4 w-4 mr-1" /> Praxis-Portfolio (A4)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTailorModalOpen(true)}
            className="card-hover-effect border-primary/30 text-primary hover:bg-primary-soft"
          >
            <Sparkles className="h-4 w-4 mr-1" /> Stellen-Tailoring (1-Klick)
          </Button>
          <Button variant="outline" size="sm" onClick={() => setJsonResumeOpen(true)}>
            <FileCode className="h-4 w-4 mr-1 text-primary" /> JSON-Resume (Im-/Export)
          </Button>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" /> Profil bearbeiten
            </Button>
          </Link>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> PDF drucken / speichern
          </Button>
        </div>
      </header>

      {/* ATS Compatibility Score */}
      <AtsScoreCard preferences={preferences} />

      {/* Anschreiben A/B-Split-Testing */}
      <CoverLetterAbCard
        companyName={applications && applications.length > 0 ? applications[0].company.name : "Tech-Unternehmen"}
        position={applications && applications.length > 0 ? applications[0].position : preferences.desiredRole || "Frontend Entwickler"}
        techStack={preferences.techStack}
        applicantName={preferences.fullName}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Konfiguration */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Design & Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex flex-col gap-2">
                {[
                  { id: "MODERN", label: "Modern (Akzentfarbe Indigo)", desc: "Frisch, modern, ideal für Web & Frontend" },
                  { id: "MODERN_TWO_COLUMN", label: "Modern Two-Column (Profil-Sidebar)", desc: "2-Spaltig mit dunkler Tech-Sidebar & kompakter Timeline" },
                  { id: "ATS_MINIMAL", label: "ATS Minimalist (100% Parser-sicher)", desc: "Textfokussiert, optimal für US & Großkonzern ATS-Scanner" },
                  { id: "CLASSIC", label: "Klassisch (Dezente Schiefer-Töne)", desc: "Zeitlos, formell für Behörden & Banken" },
                  { id: "COMPACT", label: "Kompakt (Platzsparend)", desc: "Optimiert für eine Seite" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                      layout === item.id
                        ? "border-primary bg-primary-soft/40"
                        : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name="layout"
                      value={item.id}
                      checked={layout === item.id}
                      onChange={() => setLayout(item.id as CvLayout)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ausbildung / Werdegang auswählen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" /> Stationen im Lebenslauf
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Ausbildung & Werdegang:</p>
              {preferences.educationEntries.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEducation.includes(e.id)}
                    onChange={() => toggleEducation(e.id)}
                    className="rounded border-border"
                  />
                  <span>{e.title}</span>
                </label>
              ))}

              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs text-muted-foreground mb-2">Projekte & Referenzen:</p>
                {preferences.projectEntries.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="rounded border-border"
                    />
                    <span>{p.title}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reihenfolge der Abschnitte sortieren */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-primary" /> Reihenfolge der Abschnitte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {sectionOrder.map((sec, idx) => {
                const labels: Record<CvSection, string> = {
                  PROFILE: "Kurzprofil / Intro",
                  EDUCATION: "Ausbildung & Werdegang",
                  PROJECTS: "Praxisprojekte & Referenzen",
                  SKILLS: "Kenntnisse & Tech-Stack",
                };
                return (
                  <div
                    key={sec}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-medium text-foreground">{labels[sec]}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, "UP")}
                        className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
                        title="Nach oben verschieben"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === sectionOrder.length - 1}
                        onClick={() => moveSection(idx, "DOWN")}
                        className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
                        title="Nach unten verschieben"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Live Vorschau */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Live-Vorschau (Druckansicht)</CardTitle>
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Drucken
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[600px] bg-slate-100 dark:bg-slate-900 rounded-b-xl overflow-hidden">
              <iframe
                srcDoc={cvHtml}
                title="Lebenslauf Vorschau"
                className="w-full h-full min-h-[600px] border-0 bg-white"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <JsonResumeModal
        open={jsonResumeOpen}
        onClose={() => setJsonResumeOpen(false)}
        onImported={async () => {
          await mutate("/api/preferences");
        }}
      />

      {applications && (
        <CvTailorModal
          open={tailorModalOpen}
          onClose={() => setTailorModalOpen(false)}
          preferences={preferences}
          applications={applications}
        />
      )}
    </div>
  );
}
