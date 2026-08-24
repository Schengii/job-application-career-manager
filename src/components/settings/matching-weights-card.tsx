"use client";

// -----------------------------------------------------------------------------
// Match-Score Gewichtungs-Feineinstellung (Settings-Komponente)
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Sliders, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface MatchWeightsConfig {
  techWeight: number; // 0–100
  locationWeight: number; // 0–100
  roleWeight: number; // 0–100
}

const DEFAULT_WEIGHTS: MatchWeightsConfig = {
  techWeight: 50,
  locationWeight: 25,
  roleWeight: 25,
};

export function MatchingWeightsCard() {
  const toast = useToast();
  const [weights, setWeights] = useState<MatchWeightsConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_WEIGHTS;
    try {
      const saved = localStorage.getItem("career_matching_weights");
      return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  });

  function handleSave() {
    try {
      localStorage.setItem("career_matching_weights", JSON.stringify(weights));
      toast.success("Matching-Gewichtungen erfolgreich gespeichert!");
    } catch {
      toast.error("Speichern der Gewichtungen fehlgeschlagen.");
    }
  }

  function handleReset() {
    setWeights(DEFAULT_WEIGHTS);
    try {
      localStorage.setItem("career_matching_weights", JSON.stringify(DEFAULT_WEIGHTS));
      toast.success("Standard-Gewichtungen (50% / 25% / 25%) wiederhergestellt.");
    } catch {
      // Ignore
    }
  }

  const sum = weights.techWeight + weights.locationWeight + weights.roleWeight;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Match-Score Gewichtungs-Feineinstellung
            </h3>
            <p className="text-xs text-muted-foreground">
              Passe an, wie stark Tech-Stack, Standort und Rollen-Keywords in die Berechnung einfließen
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            sum === 100
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          }`}
        >
          Summe: {sum}% {sum === 100 ? "✓" : "(Empfohlen: 100%)"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tech Stack */}
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-foreground">💻 Tech-Stack</span>
            <span className="text-primary">{weights.techWeight}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={weights.techWeight}
            onChange={(e) =>
              setWeights({ ...weights, techWeight: parseInt(e.target.value, 10) })
            }
            className="w-full accent-primary cursor-pointer"
          />
          <p className="text-[10px] text-muted-foreground">
            React, Next.js, TypeScript, Tailwind & CSS Skills
          </p>
        </div>

        {/* Standort / Remote */}
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-foreground">📍 Standort & Remote</span>
            <span className="text-sky-500">{weights.locationWeight}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={weights.locationWeight}
            onChange={(e) =>
              setWeights({ ...weights, locationWeight: parseInt(e.target.value, 10) })
            }
            className="w-full accent-sky-500 cursor-pointer"
          />
          <p className="text-[10px] text-muted-foreground">
            Bonn, Köln, Dortmund & 100% Home-Office-Quote
          </p>
        </div>

        {/* Rollen-Keywords */}
        <div className="rounded-lg border border-border bg-surface-hover/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-foreground">🎯 Rollen-Keywords</span>
            <span className="text-amber-500">{weights.roleWeight}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={weights.roleWeight}
            onChange={(e) =>
              setWeights({ ...weights, roleWeight: parseInt(e.target.value, 10) })
            }
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[10px] text-muted-foreground">
            Fachinformatiker, Frontend, Junior Web Developer
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> Zurücksetzen
        </Button>
        <Button size="sm" onClick={handleSave} className="card-hover-effect">
          <Check className="h-4 w-4 text-white" />
          <span>Gewichtung speichern</span>
        </Button>
      </div>
    </div>
  );
}
