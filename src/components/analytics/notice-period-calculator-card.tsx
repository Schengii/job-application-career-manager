"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { calculateNoticePeriod, NoticePeriodRule } from "@/lib/career/noticePeriodCalculator";
import { Calendar, Clock, Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function NoticePeriodCalculatorCard() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const [status, setStatus] = useState<"EMPLOYED" | "NOTICE_GIVEN" | "UNEMPLOYED_OR_STUDENT">("EMPLOYED");
  const [rule, setRule] = useState<NoticePeriodRule>("MONTHS_END");
  const [months, setMonths] = useState(1);
  const [vacationDays, setVacationDays] = useState(5);
  const [overtimeHours, setOvertimeHours] = useState(16);

  const result = calculateNoticePeriod({
    currentStatus: status,
    rule,
    customMonths: months,
    remainingVacationDays: vacationDays,
    overtimeHours,
  });

  function handleCopySnippet() {
    navigator.clipboard.writeText(result.coverLetterSnippet);
    setCopied(true);
    toast.success("Eintritts-Formulierung kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-500" /> Kündigungsfristen- & Eintrittstermin-Rechner 🗓️
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Berechne deinen frühestmöglichen Arbeitsbeginn nach BGB § 622 unter Anrechnung von Resturlaub & Überstunden.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-foreground">Aktueller Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="text-xs"
            >
              <option value="EMPLOYED">Ungekündigtes Arbeitsverhältnis</option>
              <option value="NOTICE_GIVEN">Kündigung bereits eingereicht</option>
              <option value="UNEMPLOYED_OR_STUDENT">Arbeitssuchend / Umschulung beendet</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block font-medium text-foreground">Vertragliche Frist</label>
            <Select
              value={rule}
              onChange={(e) => setRule(e.target.value as any)}
              disabled={status === "UNEMPLOYED_OR_STUDENT"}
              className="text-xs"
            >
              <option value="MONTHS_END">Monate zum Monatsende</option>
              <option value="MONTHS_MID_OR_END">Monate zum 15. oder Monatsende</option>
              <option value="QUARTER_END">Monate zum Quartalsende</option>
              <option value="BGB_STATUTORY">4 Wochen zum 15. / Monatsende (BGB)</option>
              <option value="PROBATION_2_WEEKS">2 Wochen zu jedem Tag (Probezeit)</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block font-medium text-foreground">Frist-Dauer (Monate)</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              disabled={status === "UNEMPLOYED_OR_STUDENT" || rule === "PROBATION_2_WEEKS" || rule === "BGB_STATUTORY"}
              className="text-xs"
            />
          </div>
        </div>

        {status !== "UNEMPLOYED_OR_STUDENT" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="mb-1 block font-medium text-foreground">Verbleibender Resturlaub (Tage)</label>
              <Input
                type="number"
                min={0}
                value={vacationDays}
                onChange={(e) => setVacationDays(Number(e.target.value))}
                className="text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-foreground">Abzubauende Überstunden (Stunden)</label>
              <Input
                type="number"
                min={0}
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(Number(e.target.value))}
                className="text-xs"
              />
            </div>
          </div>
        )}

        {/* Ergebnis-Kachel */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Frühestmöglicher Eintrittstermin:
              </span>
              <span className="text-xl font-black text-foreground">
                {result.earliestStartDate.toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {result.effectiveFreeDays > 0 && (
              <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1">
                {result.effectiveFreeDays} freie Tage vor Start (Urlaub & Überstunden)
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{result.noticeTargetDescription}</p>

          <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Formulierungsvorschlag für dein Anschreiben:
              </span>
              <Button size="sm" variant="ghost" onClick={handleCopySnippet} className="h-7 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Kopieren
              </Button>
            </div>
            <p className="text-xs font-mono text-muted-foreground bg-surface-hover/50 p-2 rounded leading-relaxed">
              &quot;{result.coverLetterSnippet}&quot;
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
