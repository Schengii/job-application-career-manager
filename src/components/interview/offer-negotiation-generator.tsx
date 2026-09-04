"use client";

// -----------------------------------------------------------------------------
// Interaktiver Gehaltsverhandlungs- & E-Mail-Generator
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import {
  Mail,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  generateOfferNegotiationEmail,
  NegotiationScenario,
} from "@/lib/salary/offerNegotiationGenerator";

const SCENARIOS: { id: NegotiationScenario; label: string; desc: string }[] = [
  {
    id: "HIGHER_BASE_SALARY",
    label: "Höheres Fixgehalt (+8% bis +15%)",
    desc: "Forderung nach Anpassung der Grundvergütung basierend auf Qualifikation & Tech-Stack",
  },
  {
    id: "REMOTE_AND_PERKS",
    label: "Remote-Tage & Weiterbildungsbudget",
    desc: "Verhandlung von Zusatzleistungen (z. B. 100% Homeoffice, React-Konferenzbudget)",
  },
  {
    id: "COMPETING_OFFER",
    label: "Konkurrierendes Zweit-Angebot",
    desc: "Hebelung eines vorliegenden Gegenangebots für maximalen Verhandlungsspielraum",
  },
  {
    id: "SIGN_ON_BONUS",
    label: "Wechselprämie / Sign-on Bonus",
    desc: "Ausgleich entfallender Boni oder Urlaubsansprüche durch Einmalzahlung",
  },
];

export function OfferNegotiationGenerator({
  defaultCompany = "Tech Partner GmbH",
  defaultPosition = "Frontend Developer (React / Next.js)",
  defaultOfferedSalary = 54000,
  defaultTargetSalary = 60000,
}: {
  defaultCompany?: string;
  defaultPosition?: string;
  defaultOfferedSalary?: number;
  defaultTargetSalary?: number;
}) {
  const [scenario, setScenario] = useState<NegotiationScenario>("HIGHER_BASE_SALARY");
  const candidateName = "Max Mustermann";
  const [recruiterName, setRecruiterName] = useState("Frau Müller");
  const [companyName, setCompanyName] = useState(defaultCompany);
  const position = defaultPosition;
  const [offeredSalary, setOfferedSalary] = useState(defaultOfferedSalary);
  const [targetSalary, setTargetSalary] = useState(defaultTargetSalary);
  const [competingSalary, setCompetingSalary] = useState(defaultTargetSalary + 3000);
  const [copied, setCopied] = useState(false);

  const generated = useMemo(() => {
    return generateOfferNegotiationEmail({
      candidateName,
      recruiterName,
      companyName,
      position,
      offeredSalary,
      targetSalary,
      scenario,
      competingSalary,
    });
  }, [
    candidateName,
    recruiterName,
    companyName,
    position,
    offeredSalary,
    targetSalary,
    scenario,
    competingSalary,
  ]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        `Betreff: ${generated.subject}\n\n${generated.body}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Parameter Konfiguration */}
      <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Verhandlungsszenario
        </h3>

        <div className="space-y-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenario(s.id)}
              className={`w-full text-left rounded-lg border p-2.5 transition-all text-xs ${
                scenario === s.id
                  ? "border-primary bg-primary-soft/40 font-semibold ring-1 ring-primary/30"
                  : "border-border bg-surface hover:bg-surface-hover/70 text-muted-foreground"
              }`}
            >
              <div className="text-foreground">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>

        <div className="space-y-3 pt-2 border-t border-border/70 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Angebotenes Gehalt (€ p.a.)
            </label>
            <input
              type="number"
              value={offeredSalary}
              onChange={(e) => setOfferedSalary(Number(e.target.value))}
              className="h-8 w-full rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Dein Zielgehalt (€ p.a.)
            </label>
            <input
              type="number"
              value={targetSalary}
              onChange={(e) => setTargetSalary(Number(e.target.value))}
              className="h-8 w-full rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {scenario === "COMPETING_OFFER" && (
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Zweitangebot Gehalt (€ p.a.)
              </label>
              <input
                type="number"
                value={competingSalary}
                onChange={(e) => setCompetingSalary(Number(e.target.value))}
                className="h-8 w-full rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Ansprechpartner/in (z. B. Frau Schmidt)
            </label>
            <input
              type="text"
              value={recruiterName}
              onChange={(e) => setRecruiterName(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Unternehmen
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Vorschau des E-Mail Schreibens */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-surface/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                Generierte Verhandlungs-E-Mail
              </CardTitle>
              <Button size="sm" variant="primary" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" /> Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Text kopieren
                  </>
                )}
              </Button>
            </div>
            <div className="mt-2 rounded-md bg-surface-hover/80 p-2 text-xs font-mono text-foreground border border-border/60">
              <span className="text-muted-foreground">Betreff: </span>
              {generated.subject}
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="whitespace-pre-wrap rounded-lg bg-surface p-4 text-xs font-mono leading-relaxed border border-border text-foreground">
              {generated.body}
            </div>

            {/* Taktischer Ratschlag */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Taktischer Verhandlungstipp:</strong> {generated.tacticalAdvice}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
