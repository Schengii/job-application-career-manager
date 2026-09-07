"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { auditEmploymentContractText, ContractAuditSummary } from "@/lib/salary/contractChecker";
import { FileText, ShieldAlert, CheckCircle2, AlertTriangle, Info, Sparkles } from "lucide-react";

export function ContractCheckerCard() {
  const [contractText, setContractText] = useState("");
  const [audit, setAudit] = useState<ContractAuditSummary | null>(null);

  function handleAudit() {
    if (!contractText.trim()) return;
    const res = auditEmploymentContractText(contractText);
    setAudit(res);
  }

  function handleSample() {
    const sample = `§ 3 Arbeitszeit & Überstunden
Die regelmäßige wöchentliche Arbeitszeit beträgt 40 Stunden. Etwaige anfallende Überstunden sind mit dem vereinbarten Bruttogehalt von 4.200 € vollumfänglich abgegolten.

§ 5 Probezeit
Das Arbeitsverhältnis beginnt am 01.11.2026. Die ersten 6 Monate gelten als Probezeit mit einer Kündigungsfrist von zwei Wochen.

§ 8 Mobiles Arbeiten
Der Mitarbeiter darf nach Absprache bis zu 2 Tage pro Woche im Home-Office arbeiten. Ein Rechtsanspruch hierauf besteht nicht, der Arbeitgeber kann die Regelung jederzeit widerrufen.

§ 12 Nachvertragliches Wettbewerbsverbot
Der Mitarbeiter verpflichtet sich, nach Beendigung des Arbeitsverhältnisses für 1 Jahr bei keinem Wettbewerber tätig zu werden.`;
    setContractText(sample);
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" /> Arbeitsvertrags- & Klausel-Checker ⚖️
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analysiere Vertragsentwürfe oder Angebotstexte auf unzulässige Überstundenklauseln, nichtige Wettbewerbsverbote und Fallstricke.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleSample} className="text-xs h-8">
          Muster-Vertrag laden
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Textarea
            rows={5}
            placeholder="Füge hier Auszüge aus deinem Arbeitsvertrag ein (z. B. Paragraphen zu Gehalt, Überstunden, Probezeit, Home-Office) …"
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            className="text-xs font-mono leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            onClick={handleAudit}
            disabled={!contractText.trim()}
            className="shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Vertragsklauseln jetzt prüfen
          </Button>
        </div>

        {audit && (
          <div className="rounded-xl border border-border bg-surface-hover/30 p-4 space-y-4 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    audit.overallRisk === "HIGH"
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      : audit.overallRisk === "MEDIUM"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  Gesamtrisiko: {audit.overallRisk === "HIGH" ? "HOCH (Prüfbedarf!)" : audit.overallRisk === "MEDIUM" ? "MITTEL" : "GERING (Fair)"}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Score: {audit.score} / 100
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {audit.criticalIssuesCount} Kritisch · {audit.warningsCount} Warnung(en) · {audit.positivePointsCount} Positiv
              </span>
            </div>

            <div className="space-y-3">
              {audit.clauses.map((clause) => (
                <div
                  key={clause.id}
                  className={`rounded-lg border p-3 text-xs space-y-1.5 ${
                    clause.severity === "CRITICAL"
                      ? "border-rose-500/40 bg-rose-500/5"
                      : clause.severity === "WARNING"
                      ? "border-amber-500/40 bg-amber-500/5"
                      : clause.severity === "GOOD"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {clause.severity === "CRITICAL" && <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />}
                      {clause.severity === "WARNING" && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                      {clause.severity === "GOOD" && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {clause.severity === "INFO" && <Info className="h-4 w-4 text-sky-500 shrink-0" />}
                      {clause.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">{clause.category}</span>
                  </div>

                  <p className="text-foreground leading-relaxed">{clause.explanation}</p>
                  <p className="text-[11px] text-muted-foreground italic">Rechtlicher Kontext: {clause.legalContext}</p>
                  <div className="rounded bg-primary/10 p-2 text-primary text-[11px] font-medium">
                    💡 <strong>Verhandlungstipp:</strong> {clause.negotiationTip}
                  </div>
                </div>
              ))}

              {audit.clauses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Keine auffälligen Standard-Klauseln in diesem Textabschnitt erkannt.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
