"use client";

import { useState } from "react";
import { Handshake, Copy, Check, Sparkles, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  generateCounterOfferStrategy,
  type CounterOfferStrategy,
} from "@/lib/salary/counterOfferGenerator";

export function CounterOfferAssistantCard() {
  const toast = useToast();
  const [offeredSalary, setOfferedSalary] = useState(48000);
  const [targetSalary, setTargetSalary] = useState(54000);
  const [companyName, setCompanyName] = useState("Zielunternehmen GmbH");
  const [position, setPosition] = useState("Frontend Entwickler (React/TS)");
  const [contactPerson, setContactPerson] = useState("Frau Schneider");
  const [copied, setCopied] = useState(false);

  const [strategy, setStrategy] = useState<CounterOfferStrategy>(() =>
    generateCounterOfferStrategy({
      offeredSalary: 48000,
      targetSalary: 54000,
      companyName: "Zielunternehmen GmbH",
      position: "Frontend Entwickler (React/TS)",
      contactPerson: "Frau Schneider",
      strongestSkills: ["React 19", "TypeScript", "Next.js"],
    })
  );

  function handleRecalculate() {
    const s = generateCounterOfferStrategy({
      offeredSalary: Number(offeredSalary) || 0,
      targetSalary: Number(targetSalary) || 0,
      companyName: companyName || "Unternehmen",
      position: position || "Entwickler",
      contactPerson: contactPerson || undefined,
      strongestSkills: ["React", "TypeScript", "Next.js"],
    });
    setStrategy(s);
    toast.success("Verhandlungsstrategie neu berechnet!");
  }

  function handleCopy() {
    navigator.clipboard.writeText(strategy.letterDraft);
    setCopied(true);
    toast.success("Gegenangebot-Entwurf kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Handshake className="h-5 w-5 text-indigo-500" />
              Gegenangebots- & Nachverhandlungs-Assistent
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Berechne professionelle Gegenangebote und formuliere souveräne Antwort-Mails bei Gehaltsangeboten unter Wunschgehalt.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 rounded-lg border border-border/60 bg-surface-hover/20 p-3">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Vorliegendes Angebot (€):</span>
            <Input
              type="number"
              value={offeredSalary}
              onChange={(e) => setOfferedSalary(Number(e.target.value))}
              className="text-xs h-8"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Wunsch-/Zielgehalt (€):</span>
            <Input
              type="number"
              value={targetSalary}
              onChange={(e) => setTargetSalary(Number(e.target.value))}
              className="text-xs h-8"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Position:</span>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Unternehmen:</span>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">Ansprechpartner:</span>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" size="sm" onClick={handleRecalculate} className="h-8 text-xs w-full">
              Neu berechnen
            </Button>
          </div>
        </div>

        {/* KPI Difference & Recommended Counter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30">
            <span className="text-[11px] text-muted-foreground block">Differenz zum Wunschgehalt</span>
            <span
              className={`text-lg font-bold ${
                strategy.differenceAmount > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {strategy.differenceAmount > 0 ? `-${strategy.differenceAmount.toLocaleString("de-DE")} € (-${strategy.differencePercent}%)` : "Angebot deckt Wunschgehalt ab ✅"}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30">
            <span className="text-[11px] text-muted-foreground block">Empfohlenes Gegenangebot</span>
            <span className="text-lg font-bold text-primary">
              {strategy.recommendedCounterAmount.toLocaleString("de-DE")} €
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30">
            <span className="text-[11px] text-muted-foreground block">Verhandlungstaktik</span>
            <span className="text-xs font-semibold text-foreground block mt-1">
              {strategy.differenceAmount > 0 ? "Nachverhandlung empfohlen (Hebel nutzen)" : "Direkt annehmen oder Benefits optimieren"}
            </span>
          </div>
        </div>

        {/* Levers & Strategy */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-primary" /> Zusätzliche Hebel & Verhandlungsoptionen:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strategy.negotiationLevers.map((lever, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border border-border/60 bg-surface text-xs space-y-0.5">
                <span className="font-semibold text-foreground block">{lever.title}</span>
                <p className="text-[11px] text-muted-foreground">{lever.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Letter Draft Preview */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Vorformulierter Gegenangebots-Brief:
            </span>
            <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? "Kopiert" : "Entwurf kopieren"}
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-border/60 text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto scroll-thin">
            {strategy.letterDraft}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
