"use client";

import { Download, Globe, Puzzle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BrowserExtensionCard() {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Puzzle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Browser-Erweiterung (Career Manager Clipper)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Stellenanzeigen von StepStone, Indeed, LinkedIn & Karriereseiten mit 1 Klick direkt ins Dashboard clippen.
              </p>
            </div>
          </div>
          <a href="/api/extension/download" download>
            <Button size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Erweiterung (.ZIP) herunterladen
            </Button>
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Globe className="h-4 w-4" />
            Installation in Google Chrome, Microsoft Edge oder Brave in 3 Schritten:
          </h4>
          <ol className="mt-3 space-y-2 text-xs text-foreground/90">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                1
              </span>
              <span>
                Oben auf <strong>„Erweiterung (.ZIP) herunterladen“</strong> klicken und die ZIP-Datei auf deiner Festplatte entpacken.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                2
              </span>
              <span>
                Im Browser die Adresse <code className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-primary">chrome://extensions</code> (oder <code className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-primary">edge://extensions</code>) öffnen und oben rechts den <strong>Entwicklermodus</strong> aktivieren.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                3
              </span>
              <span>
                Auf <strong>„Entpackte Erweiterung laden“</strong> klicken und den entpackten Ordner auswählen.
              </span>
            </li>
          </ol>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              JSON-LD & OpenGraph Parser
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Liest strukturierte Job-Daten, Gehälter, Arbeitsort und Remote-Kriterien automatisch aus dem DOM.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Keyword-Extraktion
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Erkennt relevante Web-Technologien (React, TypeScript, Next.js, Tailwind, etc.) direkt aus dem Fließtext.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              100% Lokale Privatsphäre
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Kommuniziert ausschließlich direkt mit deiner lokalen Instanz (<code className="font-mono">localhost:3000</code>).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
