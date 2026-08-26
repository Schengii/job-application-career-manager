"use client";

// -----------------------------------------------------------------------------
// Total Compensation & Benefit Calculator Component
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import {
  Coins,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  calculateTotalCompensation,
  generateNegotiationEmailScript,
  CompensationOffer,
} from "@/lib/totalCompensation";

export function TotalCompensationCard() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [targetNegotiation, setTargetNegotiation] = useState(52000);

  const [offer, setOffer] = useState<CompensationOffer>({
    id: "offer-1",
    companyName: "adesso SE / Beispiel AG",
    role: "Frontend Developer (React / Next.js)",
    baseSalaryYear: 48000,
    monthsPerYear: 12,
    bonusYear: 2500,
    bavEmployerShareMonth: 50,
    transitPassYear: 588, // Deutschlandticket
    homeOfficeAllowanceYear: 600,
    learningBudgetYear: 1200,
    hardwareBudgetYear: 800,
    weeklyHours: 39,
    vacationDays: 30,
    homeOfficeDaysPerWeek: 3,
    commuteTimeMinutesOneWay: 35,
  });

  const result = useMemo(() => {
    return calculateTotalCompensation(offer);
  }, [offer]);

  const script = useMemo(() => {
    return generateNegotiationEmailScript(result, targetNegotiation, "Alexander Schepp");
  }, [result, targetNegotiation]);

  function handleCopyScript() {
    navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success("Verhandlungs-E-Mail in Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-500" /> Total Compensation & Benefit-Rechner (TC)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ermittelt den echten Gesamtwert eines Vertragsangebots inkl. Benefits, Zeitersparnis und realem Stundenlohn.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div>
            <Input
              label="Grundgehalt (€ / Jahr)"
              type="number"
              value={offer.baseSalaryYear}
              onChange={(e) => setOffer({ ...offer, baseSalaryYear: Number(e.target.value) })}
            />
          </div>
          <div>
            <Input
              label="Monatsgehälter (12 oder 13)"
              type="number"
              value={offer.monthsPerYear}
              onChange={(e) => setOffer({ ...offer, monthsPerYear: Number(e.target.value) })}
            />
          </div>
          <div>
            <Input
              label="Variabler Bonus (€ / Jahr)"
              type="number"
              value={offer.bonusYear || 0}
              onChange={(e) => setOffer({ ...offer, bonusYear: Number(e.target.value) })}
            />
          </div>
          <div>
            <Input
              label="Wochenarbeitszeit (Std)"
              type="number"
              value={offer.weeklyHours}
              onChange={(e) => setOffer({ ...offer, weeklyHours: Number(e.target.value) })}
            />
          </div>
          <div>
            <Input
              label="Urlaubstage"
              type="number"
              value={offer.vacationDays}
              onChange={(e) => setOffer({ ...offer, vacationDays: Number(e.target.value) })}
            />
          </div>
          <div>
            <Input
              label="Home-Office Tage / Woche"
              type="number"
              value={offer.homeOfficeDaysPerWeek}
              onChange={(e) => setOffer({ ...offer, homeOfficeDaysPerWeek: Number(e.target.value) })}
            />
          </div>
          <div>
            <Input
              label="Weiterbildungsbudget (€)"
              type="number"
              value={offer.learningBudgetYear || 0}
              onChange={(e) => setOffer({ ...offer, learningBudgetYear: Number(e.target.value) })}
            />
          </div>
          <div>
            <Input
              label="ÖPNV / Jobticket (€ / Jahr)"
              type="number"
              value={offer.transitPassYear || 0}
              onChange={(e) => setOffer({ ...offer, transitPassYear: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Results Banner */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Total Compensation (TC)
            </span>
            <div className="text-2xl font-extrabold text-foreground mt-1">
              {result.totalCompensationYear.toLocaleString("de-DE")} € / Jahr
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              (Grundgehalt + {result.totalMonetaryBenefitsYear.toLocaleString("de-DE")} € monetäre Benefits)
            </p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Geschätztes Netto (SK1)
            </span>
            <div className="text-2xl font-extrabold text-foreground mt-1">
              ca. {result.estimatedNettoMonth.toLocaleString("de-DE")} € / Monat
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              (ca. {result.estimatedNettoYear.toLocaleString("de-DE")} € Netto pro Jahr)
            </p>
          </div>

          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Realer Stundenlohn
            </span>
            <div className="text-2xl font-extrabold text-foreground mt-1">
              {result.effectiveHourlyRate.toFixed(2)} € / Std
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Inkl. {result.yearlyCommuteHours}h Pendelzeit bei {offer.homeOfficeDaysPerWeek} Tagen Home-Office
            </p>
          </div>
        </div>

        {/* Negotiation Generator */}
        <div className="rounded-xl border border-border bg-surface-hover/30 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> Gehaltsverhandlungs-Assistent
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Wunsch-Gehalt:</span>
              <input
                type="number"
                value={targetNegotiation}
                onChange={(e) => setTargetNegotiation(Number(e.target.value))}
                className="w-24 rounded border border-border bg-surface px-2 py-1 text-xs font-bold text-foreground"
              />
              <Button size="sm" variant="outline" onClick={handleCopyScript} className="h-7 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                E-Mail kopieren
              </Button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-border/70 bg-surface p-3 font-sans text-xs text-muted-foreground leading-relaxed">
            {script}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
