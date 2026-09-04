"use client";

// -----------------------------------------------------------------------------
// KI-Kosten-/Token-Übersicht (Einstellungen -> Profil & Präferenzen)
// -----------------------------------------------------------------------------
// Zeigt, wie viel der in der PreferencesForm hinterlegte KI-API-Key (OpenAI/
// Anthropic/Ollama) tatsächlich verbraucht — siehe src/lib/aiUsageTracker.ts.
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Coins, Trash2, AlertTriangle, Wallet } from "lucide-react";
import { fetcher, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { AiUsageSummary } from "@/lib/aiUsageTracker";
import { getAiMonthlyBudgetUsd, setAiMonthlyBudgetUsd } from "@/lib/aiBudget";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
  ollama: "Ollama (lokal)",
};

const ACTION_LABELS: Record<string, string> = {
  POLISH_COVER_LETTER: "Anschreiben-Politur",
  EVALUATE_INTERVIEW_ANSWER: "Interview-Bewertung",
  GENERATE_OPENING_SENTENCE: "Einleitungssatz",
};

function formatUsd(value: number): string {
  if (value === 0) return "$0,00";
  if (value < 0.01) return "< $0,01";
  return `$${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AiUsageCard() {
  const { data: usage, isLoading } = useSWR<AiUsageSummary>("/api/ai/usage", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  // Lazy-Initializer statt useEffect (analog zu `getSavedFilters()` in
  // saved-filters-bar.tsx) — localStorage ist client-only, ein SSR-Vorrendern
  // liefert hier ohnehin immer "" (kein funktionaler Unterschied, da das
  // Limit reine UI-Warnschwelle ist, keine sicherheitsrelevante Sperre).
  const [budgetInput, setBudgetInput] = useState(() => {
    const stored = getAiMonthlyBudgetUsd();
    return stored !== null ? String(stored) : "";
  });

  function handleBudgetChange(raw: string) {
    setBudgetInput(raw);
    const parsed = Number(raw);
    setAiMonthlyBudgetUsd(raw.trim() === "" || !Number.isFinite(parsed) ? null : parsed);
  }

  async function handleReset() {
    if (!confirm("Die gesamte KI-Nutzungsstatistik wirklich zurücksetzen? Das kann nicht rückgängig gemacht werden.")) return;
    try {
      await apiDelete("/api/ai/usage");
      await mutate("/api/ai/usage");
      toast.success("Nutzungsstatistik zurückgesetzt.");
    } catch {
      toast.error("Zurücksetzen fehlgeschlagen.");
    }
  }

  const monthlyBudget = getAiMonthlyBudgetUsd();
  const monthlyBudgetRatio =
    monthlyBudget && usage ? usage.currentMonthEstimatedCostUsd / monthlyBudget : null;
  const monthlyBudgetExceeded = monthlyBudgetRatio !== null && monthlyBudgetRatio >= 1;
  const monthlyBudgetNear = monthlyBudgetRatio !== null && monthlyBudgetRatio >= 0.8 && !monthlyBudgetExceeded;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">KI-Kosten & Token-Verbrauch</CardTitle>
        </div>
        {usage && usage.totalRequests > 0 && (
          <Button size="sm" variant="outline" onClick={handleReset} className="h-8">
            <Trash2 className="h-3.5 w-3.5" /> Zurücksetzen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-xs text-muted-foreground">
          Protokolliert jeden tatsächlich ausgeführten KI-Request (Anschreiben-Politur, Interview-Bewertung,
          Einleitungssatz-Generierung) seit der letzten Zurücksetzung — mit einer GESCHÄTZTEN Kostenangabe auf
          Basis öffentlicher Listenpreise. Keine Garantie für die tatsächliche Abrechnung des jeweiligen Providers.
        </p>

        {/* Monatliches Kostenlimit (Warnschwelle, keine harte Sperre) */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
          <div className="min-w-[12rem]">
            <label htmlFor="ai-monthly-budget" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" /> Monatliches Kostenlimit (USD, optional)
            </label>
            <Input
              id="ai-monthly-budget"
              type="number"
              min={0}
              step={0.5}
              placeholder="z. B. 10"
              value={budgetInput}
              onChange={(e) => handleBudgetChange(e.target.value)}
              className="h-9 w-32 text-xs"
            />
          </div>
          {usage && monthlyBudget && (
            <p
              className={cn(
                "text-xs font-medium",
                monthlyBudgetExceeded
                  ? "text-rose-500"
                  : monthlyBudgetNear
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              Diesen Monat bisher {formatUsd(usage.currentMonthEstimatedCostUsd)} von {formatUsd(monthlyBudget)}
              {monthlyBudgetExceeded && " — Limit erreicht/überschritten"}
              {monthlyBudgetNear && " — nähert sich dem Limit"}
            </p>
          )}
          <p className="w-full text-[11px] text-muted-foreground">
            Nur eine Warnanzeige — KI-Funktionen werden bei Erreichen NICHT gesperrt. Nur lokal in diesem Browser
            gespeichert (nicht Teil eines Backup-Exports).
          </p>
        </div>

        {isLoading && <p className="text-xs text-muted-foreground">Lade Statistik …</p>}

        {usage && usage.totalRequests === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Noch keine KI-Requests protokolliert. Sobald ein Provider in den Präferenzen hinterlegt ist und
            tatsächlich genutzt wird (z. B. beim Anschreiben-Polishing), erscheint hier die Statistik.
          </p>
        )}

        {usage && usage.totalRequests > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-[11px] text-muted-foreground">Requests</p>
                <p className="text-lg font-bold text-foreground">{usage.totalRequests}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-[11px] text-muted-foreground">Tokens gesamt</p>
                <p className="text-lg font-bold text-foreground">{usage.totalTokens.toLocaleString("de-DE")}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-[11px] text-muted-foreground">Prompt / Antwort</p>
                <p className="text-sm font-semibold text-foreground">
                  {usage.totalPromptTokens.toLocaleString("de-DE")} / {usage.totalCompletionTokens.toLocaleString("de-DE")}
                </p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary-soft/30 p-3">
                <p className="text-[11px] text-muted-foreground">Geschätzte Kosten</p>
                <p className="text-lg font-bold text-primary">{formatUsd(usage.totalEstimatedCostUsd)}</p>
              </div>
            </div>

            {usage.hasUnknownPricing && (
              <p className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Mindestens ein Request nutzte einen Provider/ein Modell ohne hinterlegte Preistabelle (z. B.
                OpenRouter) — dessen Tokens sind oben mitgezählt, seine Kosten aber NICHT in der Summe enthalten.
              </p>
            )}

            {/* Aufschlüsselung nach Provider */}
            <div className="space-y-1.5">
              {Object.entries(usage.byProvider).map(([provider, stats]) => (
                <div
                  key={provider}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-foreground">{PROVIDER_LABELS[provider] ?? provider}</span>
                  <span className="text-muted-foreground">
                    {stats.requests} Requests · {stats.totalTokens.toLocaleString("de-DE")} Tokens ·{" "}
                    {formatUsd(stats.estimatedCostUsd)}
                  </span>
                </div>
              ))}
            </div>

            {/* Letzte Requests */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-surface-hover/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Zeitpunkt</th>
                    <th className="px-3 py-2 font-semibold">Aktion</th>
                    <th className="px-3 py-2 font-semibold">Modell</th>
                    <th className="px-3 py-2 font-semibold text-right">Tokens</th>
                    <th className="px-3 py-2 font-semibold text-right">Kosten</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usage.recentEntries.map((entry, idx) => (
                    <tr key={`${entry.timestamp}-${idx}`}>
                      <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-3 py-1.5 text-foreground">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                      <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[10rem]">{entry.model}</td>
                      <td className="px-3 py-1.5 text-right text-foreground">
                        {(entry.promptTokens + entry.completionTokens).toLocaleString("de-DE")}
                      </td>
                      <td className="px-3 py-1.5 text-right text-foreground">
                        {entry.estimatedCostUsd === null ? "—" : formatUsd(entry.estimatedCostUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
