"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Coins, Printer, Sparkles } from "lucide-react";
import { fetcher } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ApplicationListItem, PreferencesPublic } from "@/types";
import {
  calculateVermittlungsbudget,
  generateReimbursementApplicationHtml,
  DEFAULT_BUDGET_SETTINGS,
} from "@/lib/vermittlungsbudget";

export function VermittlungsbudgetCard() {
  const { data: applications } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  const { data: preferences } = useSWR<PreferencesPublic>("/api/preferences", fetcher);

  const [ratePerApp, setRatePerApp] = useState(5.0);

  const calculation = useMemo(() => {
    return calculateVermittlungsbudget(applications ?? [], {
      ...DEFAULT_BUDGET_SETTINGS,
      ratePerApplication: ratePerApp,
      ratePerOnlineApplication: ratePerApp,
    });
  }, [applications, ratePerApp]);

  function handlePrint() {
    const customerId = typeof window !== "undefined"
      ? localStorage.getItem("career_agentur_customer_id") || ""
      : "";

    const address = [preferences?.street, [preferences?.postalCode, preferences?.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");

    const html = generateReimbursementApplicationHtml({
      candidateName: preferences?.fullName || "Bewerber/in",
      candidateAddress: address || null,
      candidateEmail: preferences?.email || null,
      candidatePhone: preferences?.phone || null,
      customerId: customerId || null,
      calculation,
    });

    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 250);
  }

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Coins className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Vermittlungsbudget (§ 44 SGB III)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Bewerbungskosten-Erstattung bei der Agentur für Arbeit / Jobcenter
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handlePrint} disabled={calculation.totalApplicationsCount === 0}>
          <Printer className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Antrag drucken / PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-[11px] text-muted-foreground block">Erstattungsanspruch</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {calculation.totalReimbursement.toFixed(2)} €
            </span>
          </div>

          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-[11px] text-muted-foreground block">Erfasste Bewerbungen</span>
            <span className="text-xl font-bold text-foreground">
              {calculation.totalApplicationsCount}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-[11px] text-muted-foreground block">Pauschale je Bewerbung</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={ratePerApp}
                onChange={(e) => setRatePerApp(parseFloat(e.target.value) || 5.0)}
                className="h-7 w-16 rounded border border-border bg-background px-2 text-xs font-semibold text-foreground"
              />
              <span className="text-xs text-muted-foreground">€</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-[11px] text-muted-foreground block">Verbleibend (Jahresbudget)</span>
            <span className="text-xl font-bold text-muted-foreground">
              {calculation.remainingAnnualBudget.toFixed(2)} €
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-surface/80 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Spartipp für Arbeitssuchende & Umschüler:
          </p>
          <p>
            Die Agentur für Arbeit erstattet im Rahmen des Vermittlungsbudgets (§ 44 SGB III) in der Regel
            bis zu <strong>260,00 € pro Jahr</strong> für Bewerbungskosten (pauschal 5,00 € je Bewerbung) sowie
            zusätzliche Reisekosten zu Vorstellungsgesprächen. Mit Klick auf <em>„Antrag drucken / PDF“</em> erhältst
            du das unterschriftsreife Antragsformular inklusive vollständiger Nachweistabelle.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
