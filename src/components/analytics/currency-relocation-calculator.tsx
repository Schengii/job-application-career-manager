"use client";

// -----------------------------------------------------------------------------
// Multi-Währungs- & Relocation-Rechner (Kaufkraft & International Remote)
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { Globe, Sparkles, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CurrencyCode,
  LocationHub,
  LOCATION_PROFILES,
  FX_RATES,
  calculateRelocationCompensation,
} from "@/lib/currencyRelocation";

export function CurrencyRelocationCalculator() {
  const [nominalSalary, setNominalSalary] = useState<number>(65000);
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [location, setLocation] = useState<LocationHub>("BONN_KOELN");

  const result = useMemo(() => {
    return calculateRelocationCompensation({
      nominalSalaryAnnual: nominalSalary || 0,
      currency,
      targetLocation: location,
    });
  }, [nominalSalary, currency, location]);

  const activeProfile = LOCATION_PROFILES[location];

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-surface/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <Globe className="h-4 w-4 text-primary" />
            Multi-Währungs- & Relocation-Kaufkraftrechner
          </CardTitle>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            1 EUR = {FX_RATES.USD} $ • {FX_RATES.CHF} CHF • {FX_RATES.GBP} £
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Gehalts-Eingabe */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Nominales Jahresbrutto
            </label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                min="0"
                value={nominalSalary}
                onChange={(e) => setNominalSalary(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Währungsauswahl */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Währung
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="EUR">EUR (€) - Euro</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="CHF">CHF (Fr.) - Schweizer Franken</option>
              <option value="GBP">GBP (£) - Britisches Pfund</option>
            </select>
          </div>

          {/* Zielstandort */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Standort / Arbeitsmodell
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as LocationHub)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.values(LOCATION_PROFILES).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Standort-Info Badge */}
        <div className="rounded-lg bg-surface-hover/60 border border-border/70 p-3 text-xs flex items-start gap-2">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">
              {activeProfile.label} ({activeProfile.country})
            </p>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              {activeProfile.notes} Lebenshaltungskosten-Index:{" "}
              <strong className="text-foreground">{activeProfile.costOfLivingIndex}%</strong> (Basis Bonn/Köln = 100%).
            </p>
          </div>
        </div>

        {/* Ergebnis-Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <span className="text-[11px] text-muted-foreground block">Nominal in EUR</span>
            <span className="text-lg font-bold text-foreground mt-1 block">
              {result.salaryInEur.toLocaleString("de-DE")} €
            </span>
            <span className="text-[10px] text-muted-foreground">Wechselkurs-Basis</span>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3 text-center">
            <span className="text-[11px] text-primary font-semibold block">Kaufkraft-Äquivalent</span>
            <span className="text-lg font-extrabold text-primary mt-1 block">
              {result.purchasingPowerAdjustedEur.toLocaleString("de-DE")} €
            </span>
            <span className="text-[10px] text-primary/80 font-medium">Bonn-Vergleichswert</span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <span className="text-[11px] text-muted-foreground block">Geschätztes Monats-Netto</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              ~{result.estimatedNetMonthlyEur.toLocaleString("de-DE")} €
            </span>
            <span className="text-[10px] text-muted-foreground">pro Monat ausbezahlt</span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 text-center">
            <span className="text-[11px] text-muted-foreground block">Jahres-Netto (EUR)</span>
            <span className="text-lg font-bold text-foreground mt-1 block">
              ~{result.estimatedNetAnnualEur.toLocaleString("de-DE")} €
            </span>
            <span className="text-[10px] text-muted-foreground">nach regionalen Steuern</span>
          </div>
        </div>

        {/* Empfehlungs-Box */}
        <div className="rounded-xl border border-border bg-surface p-3.5 text-xs flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">KI-Kaufkraft-Einschätzung:</span>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">{result.recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
