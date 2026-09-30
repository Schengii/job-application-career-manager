"use client";

import { useState, useMemo } from "react";
import { Car, Train, Clock, DollarSign, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateCommuteAndRemoteNet,
  type CommuteTransitMode,
} from "@/lib/salary/commuteCalculator";

export function CommuteCalculatorCard() {
  const [grossSalary, setGrossSalary] = useState(48000);
  const [officeDays, setOfficeDays] = useState(2);
  const [distanceKm, setDistanceKm] = useState(30);
  const [travelTimeMinutes, setTravelTimeMinutes] = useState(40);
  const [transitMode, setTransitMode] = useState<CommuteTransitMode>("CAR");
  const [jobticketSubsidy, setJobticketSubsidy] = useState(25);

  const result = useMemo(() => {
    return calculateCommuteAndRemoteNet({
      grossSalaryAnnual: grossSalary,
      officeDaysPerWeek: officeDays,
      distanceKmOneWay: distanceKm,
      travelTimeMinutesOneWay: travelTimeMinutes,
      transitMode,
      employerTransitSubsidyMonthlyEur: jobticketSubsidy,
    });
  }, [grossSalary, officeDays, distanceKm, travelTimeMinutes, transitMode, jobticketSubsidy]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Car className="h-5 w-5 text-primary" />
          Pendelzeit-, Fahrtkosten- & Remote-Netto-Rechner (Rheinland / NRW)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ermittelt die realen Mobilitätskosten (PKW vs. ÖPNV), monatlichen Zeitverlust im Berufsverkehr
          und deinen tatsächlichen Stundenlohn nach Fahrtkosten.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Jahresbrutto */}
          <div>
            <label className="text-xs font-medium text-foreground">Jahresgehalt Brutto (€)</label>
            <input
              type="number"
              step={1000}
              value={grossSalary}
              onChange={(e) => setGrossSalary(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tage im Büro */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Vor-Ort-Tage im Büro pro Woche: <span className="font-bold text-primary">{officeDays} Tag(e)</span>
            </label>
            <input
              type="range"
              min={0}
              max={5}
              value={officeDays}
              onChange={(e) => setOfficeDays(Number(e.target.value))}
              className="mt-2 w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>100% Remote</span>
              <span>Hybrid (2-3)</span>
              <span>100% Vor Ort</span>
            </div>
          </div>

          {/* Verkehrsmittel */}
          <div>
            <label className="text-xs font-medium text-foreground">Verkehrsmittel</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setTransitMode("CAR")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  transitMode === "CAR"
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface hover:bg-surface-hover text-muted-foreground"
                }`}
              >
                <Car className="h-3.5 w-3.5" /> PKW
              </button>
              <button
                type="button"
                onClick={() => setTransitMode("TRANSIT_DEUTSCHLANDTICKET")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  transitMode === "TRANSIT_DEUTSCHLANDTICKET"
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface hover:bg-surface-hover text-muted-foreground"
                }`}
              >
                <Train className="h-3.5 w-3.5" /> ÖPNV / D-Ticket
              </button>
            </div>
          </div>

          {/* Einfache Distanz */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Einfache Entfernung: <span className="font-bold">{distanceKm} km</span>
            </label>
            <input
              type="number"
              min={1}
              max={250}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Fahrtzeit einfach */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Einfache Fahrtzeit: <span className="font-bold">{travelTimeMinutes} Min.</span>
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={travelTimeMinutes}
              onChange={(e) => setTravelTimeMinutes(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Jobticket Zuschuss */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Arbeitgeberzuschuss Mobilität (€/Monat)
            </label>
            <input
              type="number"
              min={0}
              max={200}
              value={jobticketSubsidy}
              onChange={(e) => setJobticketSubsidy(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Kennzahlen & Auswertung */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-border bg-surface-hover/50 p-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Geschätztes Netto</p>
            <p className="text-base font-bold text-foreground">
              {result.estimatedMonthlyNet.toLocaleString("de-DE")} €{" "}
              <span className="text-[10px] text-muted-foreground font-normal">/Monat</span>
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground">Monatliche Pendelkosten</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400">
              - {result.monthlyCommuteCostEur.toLocaleString("de-DE")} €{" "}
              <span className="text-[10px] font-normal text-muted-foreground">/Monat</span>
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground">Reales Netto nach Mobilität</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {result.netAfterCommuteEur.toLocaleString("de-DE")} €{" "}
              <span className="text-[10px] font-normal text-muted-foreground">/Monat</span>
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground">Zeit im Pendelverkehr</p>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Clock className="h-4 w-4" /> {result.monthlyCommuteHours} Std.{" "}
              <span className="text-[10px] font-normal text-muted-foreground">/Monat</span>
            </p>
          </div>
        </div>

        {/* Stundenlohn-Vergleich */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary-soft/10 p-3.5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Effektiver Stundenlohn (Netto)</p>
              <p className="text-[11px] text-muted-foreground">
                Nominal: <strong>{result.nominalHourlyWageNet.toFixed(2)} €/h</strong> ➔ Real inkl. Pendelzeit:{" "}
                <strong className="text-primary">{result.effectiveHourlyWageNet.toFixed(2)} €/h</strong>
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground sm:text-right">
            Jährlicher Zeitverlust: <span className="text-foreground">{result.annualCommuteHours} Stunden</span>
          </div>
        </div>

        {/* Empfehlung */}
        <div className="rounded-lg border border-border bg-surface p-3 text-xs flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Fazit & Verhandlungstipp:</strong> {result.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
