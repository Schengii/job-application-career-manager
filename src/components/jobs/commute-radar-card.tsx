"use client";

// -----------------------------------------------------------------------------
// NRW & Remote Pendel-Radar & Fahrzeit-Rechner Komponente
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Train, Car, Home, Sparkles, Clock, Compass } from "lucide-react";
import { estimateCommute } from "@/lib/jobs/commuteCalculator";

const NRW_REGIONS = [
  { label: "Bonn (Heimatstandort)", location: "Bonn", remote: false },
  { label: "Köln (Rheinland)", location: "Köln", remote: false },
  { label: "Düsseldorf (Landeshauptstadt)", location: "Düsseldorf", remote: false },
  { label: "Dortmund / Ruhrgebiet", location: "Dortmund", remote: false },
  { label: "100% Home-Office (Remote)", location: "Remote", remote: true },
];

export function CommuteRadarCard() {
  const [selectedRegion, setSelectedRegion] = useState(NRW_REGIONS[1]); // Köln default
  const [hoDays, setHoDays] = useState(2);

  const estimate = estimateCommute(selectedRegion.location, selectedRegion.remote, hoDays);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 md:p-5 glass-card shadow-xs space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              NRW Pendel- & Fahrzeit-Radar (Ausgangspunkt: Bonn)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Fahrzeiten mit Bahn / Auto & Zeitersparnis durch Home-Office berechnen
            </p>
          </div>
        </div>

        {/* Region Selector Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {NRW_REGIONS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setSelectedRegion(r)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                selectedRegion.label === r.label
                  ? "bg-primary text-white font-bold"
                  : "bg-surface-hover/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.location}
            </button>
          ))}
        </div>
      </div>

      {/* Ergebnis-Kacheln */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Bahn / ÖPNV */}
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Train className="h-3.5 w-3.5 text-primary" /> Bahn (RE / ICE)
          </div>
          <p className="text-base font-bold text-foreground">
            {estimate.isRemote ? "0 Min." : `ca. ${estimate.transitMinutes} Min.`}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {estimate.isRemote ? "Kein Pendeln" : "Deutschlandticket abgedeckt"}
          </p>
        </div>

        {/* Auto */}
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Car className="h-3.5 w-3.5 text-sky-500" /> PKW / Auto
          </div>
          <p className="text-base font-bold text-foreground">
            {estimate.isRemote ? "0 Min." : `ca. ${estimate.carMinutes} Min.`}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {estimate.isRemote ? "0 km" : "Je nach Verkehrslage"}
          </p>
        </div>

        {/* Zeitersparnis */}
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-emerald-500" /> Zeitgewinn / Jahr
          </div>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            +{estimate.annualHomeOfficeSavingsHours} Std.
          </p>
          <p className="text-[10px] text-muted-foreground">
            bei {hoDays} Home-Office-Tagen
          </p>
        </div>

        {/* CO2 & Kosten */}
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Home className="h-3.5 w-3.5 text-amber-500" /> CO₂-Ersparnis
          </div>
          <p className="text-base font-bold text-amber-600 dark:text-amber-400">
            ca. {estimate.co2SavingsKgPerYear} kg
          </p>
          <p className="text-[10px] text-muted-foreground">weniger Umweltbelastung</p>
        </div>
      </div>

      {/* Slider für Home-Office Tage */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40 text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Geplante Home-Office-Tage: <strong className="text-foreground">{hoDays} Tage / Woche</strong>
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setHoDays(d)}
              className={`h-6 w-6 rounded-md text-[11px] font-bold transition-colors ${
                hoDays === d
                  ? "bg-primary text-white"
                  : "bg-surface-hover text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
