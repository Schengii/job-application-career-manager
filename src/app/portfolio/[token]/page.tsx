"use client";

// -----------------------------------------------------------------------------
// Öffentliche, geschützte Bewerber-Landingpage (Digital Developer Portfolio)
// -----------------------------------------------------------------------------
import { use, useEffect, useState } from "react";
import useSWR from "swr";
import {
  GraduationCap,
  FolderGit2,
  Mail,
  Phone,
  MapPin,
  Code2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { fetcher } from "@/lib/core/api";
import type { PreferencesWithProfile } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PortfolioTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [tracked, setTracked] = useState(false);

  const { data: preferences, isLoading, error } = useSWR<PreferencesWithProfile>(
    "/api/preferences",
    fetcher
  );

  // Recruiter-Aufruf einmalig protokollieren
  useEffect(() => {
    if (!tracked && token) {
      fetch("/api/portfolio/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then(() => setTracked(true))
        .catch(() => {});
    }
  }, [token, tracked]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Lade Entwicklerprofil …</p>
        </div>
      </div>
    );
  }

  if (error || !preferences) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-200">
        <Card className="max-w-md border-red-500/30 bg-slate-900 text-center p-6">
          <ShieldCheck className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-xl font-bold text-slate-100">Zugriff nicht möglich</h2>
          <p className="mt-2 text-sm text-slate-400">
            Dieser Portfolio-Link ist ungültig, abgelaufen oder wurde vom Bewerber deaktiviert.
          </p>
        </Card>
      </div>
    );
  }

  const techStackList = (preferences.techStack || "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/30">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white block">
                {preferences.fullName || "Alexander Schepp"}
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Digitales Entwickler-Dossier
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Sofort verfügbar
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 flex flex-col gap-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300 mb-3">
                <Sparkles className="h-3.5 w-3.5" /> {preferences.desiredRole}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {preferences.fullName || "Alexander Schepp"}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-300 font-normal">
                {preferences.profileSummary ||
                  "Fachinformatiker für Anwendungsentwicklung mit starkem Frontend-Schwerpunkt in modernem React 19, Next.js, TypeScript und Clean Code Architektur."}
              </p>

              {/* Quick Contact & Info Grid */}
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
                {preferences.city && (
                  <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" /> {preferences.city} / Region NRW & Remote
                  </span>
                )}
                {preferences.email && (
                  <a
                    href={`mailto:${preferences.email}`}
                    className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-400 hover:text-white transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-indigo-400" /> {preferences.email}
                  </a>
                )}
                {preferences.phone && (
                  <a
                    href={`tel:${preferences.phone}`}
                    className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-400 hover:text-white transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-indigo-400" /> {preferences.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Direct Action Card */}
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-5 shrink-0 md:w-64">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Kontakt aufnehmen</span>
              <p className="text-xs text-slate-300">
                Interesse an einem persönlichen Kennenlernen oder Coding-Gespräch?
              </p>
              {preferences.email && (
                <a href={`mailto:${preferences.email}?subject=Einladung zum Gespräch`}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                    <Mail className="mr-2 h-4 w-4" /> E-Mail schreiben
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Tech Stack Matrix */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="h-5 w-5 text-indigo-400" /> Kernkompetenzen & Tech-Stack
          </h2>
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            {techStackList.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950/70 border border-indigo-500/40 px-3 py-1.5 text-xs font-semibold text-indigo-200 shadow-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Highlight Praxisprojekte */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-indigo-400" /> Ausgewählte Praxisprojekte & Referenzen
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {preferences.projectEntries.map((project) => (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white">{project.title}</h3>
                    {project.role && (
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                        {project.role}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {project.description || "Entwicklung und Umsetzung modernster Webarchitekturen."}
                  </p>
                </div>

                {project.techStack && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                    {project.techStack.split(",").map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-indigo-300"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Werdegang & Qualifikationen */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-400" /> Werdegang & Qualifikation
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 divide-y divide-slate-800">
            {preferences.educationEntries.map((edu) => (
              <div key={edu.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-sm font-bold text-white">{edu.title}</span>
                  <span className="text-xs text-slate-400">
                    {edu.startDate ? new Date(edu.startDate).getFullYear() : ""} –{" "}
                    {edu.endDate ? new Date(edu.endDate).getFullYear() : "heute"}
                  </span>
                </div>
                {edu.institution && (
                  <p className="text-xs text-indigo-400 mt-0.5">{edu.institution}</p>
                )}
                {edu.description && (
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {preferences.fullName} — Bereitgestellt via Job Application & Career Manager</p>
      </footer>
    </div>
  );
}
