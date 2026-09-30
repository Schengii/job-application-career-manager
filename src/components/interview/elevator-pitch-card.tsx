"use client";

// -----------------------------------------------------------------------------
// Interaktiver 60-Sekunden Elevator-Pitch Generator
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Sparkles, Copy, Check, Clock, Mic, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  generateElevatorPitch,
  PITCH_FOCUS_PRESETS,
  type PitchFocus,
  type GeneratedPitch,
} from "@/lib/interview/elevatorPitchGenerator";

export function ElevatorPitchCard({
  defaultCompany,
  defaultRole,
}: {
  defaultCompany?: string;
  defaultRole?: string;
}) {
  const toast = useToast();
  const [focus, setFocus] = useState<PitchFocus>("FRONTEND_EXPERT");
  const [role, setRole] = useState(defaultRole || "Frontend Entwickler (React/TS)");
  const [company, setCompany] = useState(defaultCompany || "Zielunternehmen GmbH");
  const [signatureProject, setSignatureProject] = useState(
    "Job-Application-Manager mit Next.js 16, TypeScript & Prisma"
  );
  const [copied, setCopied] = useState(false);

  const [pitch, setPitch] = useState<GeneratedPitch>(() =>
    generateElevatorPitch({
      focus: "FRONTEND_EXPERT",
      targetRole: defaultRole || "Frontend Entwickler (React/TS)",
      targetCompany: defaultCompany || "Zielunternehmen GmbH",
      signatureProject: "Job-Application-Manager mit Next.js 16, TypeScript & Prisma",
    })
  );

  function handleGenerate() {
    const p = generateElevatorPitch({
      focus,
      targetRole: role,
      targetCompany: company,
      signatureProject,
    });
    setPitch(p);
    toast.success("Elevator Pitch neu generiert!");
  }

  function handleCopy() {
    navigator.clipboard.writeText(pitch.fullPitch);
    setCopied(true);
    toast.success("Pitch in die Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mic className="h-5 w-5 text-amber-500" />
              60-Sekunden Elevator-Pitch Generator
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Maßgeschneiderte Selbstpräsentation für die Eröffnungsfrage <em>„Erzählen Sie kurz etwas über sich!“</em> im Vorstellungsgespräch.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <Clock className="h-3.5 w-3.5" />
            ca. {pitch.estimatedSpeechDurationSeconds}s Sprechzeit
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 rounded-lg border border-border/60 bg-surface-hover/20 p-3">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Schwerpunkt-Fokus:</span>
            <Select
              value={focus}
              onChange={(e) => setFocus(e.target.value as PitchFocus)}
              className="text-xs h-8"
            >
              {Object.entries(PITCH_FOCUS_PRESETS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Zielrolle / Stelle:</span>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="z.B. Frontend Entwickler"
              className="text-xs h-8"
            />
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Unternehmen:</span>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="z.B. Adesso SE"
              className="text-xs h-8"
            />
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Referenz-Projekt:</span>
            <Input
              value={signatureProject}
              onChange={(e) => setSignatureProject(e.target.value)}
              placeholder="z.B. Next.js Karriere-Manager"
              className="text-xs h-8"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              className="h-8 text-xs w-full flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Neu generieren
            </Button>
          </div>
        </div>

        {/* Pitch Struktur */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">1</span>
                Der Hook & Eröffnung
              </span>
              <span className="text-[10px] text-muted-foreground">Aufmerksamkeit & Sympathie gewinnen</span>
            </div>
            <p className="text-xs text-foreground/90 bg-surface p-2.5 rounded border border-border/40 leading-relaxed">
              {pitch.hook}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">2</span>
                Kern-Story & Tech-Stack
              </span>
              <span className="text-[10px] text-muted-foreground">Relevante Skills auf den Punkt gebracht</span>
            </div>
            <p className="text-xs text-foreground/90 bg-surface p-2.5 rounded border border-border/40 leading-relaxed">
              {pitch.coreStory}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">3</span>
                Praxis-Beweis & Referenzprojekt
              </span>
              <span className="text-[10px] text-muted-foreground">Glaubwürdigkeit durch konkrete Ergebnisse</span>
            </div>
            <p className="text-xs text-foreground/90 bg-surface p-2.5 rounded border border-border/40 leading-relaxed">
              {pitch.practicalProof}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">4</span>
                Motivation & Ball-Übergabe
              </span>
              <span className="text-[10px] text-muted-foreground">Bezug zum Unternehmen herstellen</span>
            </div>
            <p className="text-xs text-foreground/90 bg-surface p-2.5 rounded border border-border/40 leading-relaxed">
              {pitch.motivationClosing}
            </p>
          </div>
        </div>

        {/* Tactical Tips */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" /> Taktische Praxistipps für den Vortrag:
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
            {pitch.tacticalTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* Copy Button */}
        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Vollständigen Pitch kopiert!" : "Gesamten Pitch (60s) kopieren"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
