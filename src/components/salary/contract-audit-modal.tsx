"use client";

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Copy,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  IT_CONTRACT_CLAUSES,
  evaluateContractClauses,
  ContractClauseCheckItem,
} from "@/lib/salary/contractClauseAudit";

interface ContractAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  position: string;
}

export function ContractAuditModal({
  open,
  onOpenChange,
  companyName,
  position,
}: ContractAuditModalProps) {
  const toast = useToast();
  const [items, setItems] = useState<ContractClauseCheckItem[]>(() => [...IT_CONTRACT_CLAUSES]);
  const [expandedId, setExpandedId] = useState<string | null>("overtime_blanket");

  const auditResult = evaluateContractClauses(items);

  function handleSetStatus(id: string, status: ContractClauseCheckItem["status"]) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function handleCopyScript(item: ContractClauseCheckItem) {
    navigator.clipboard.writeText(item.negotiationScript);
    toast.success("Verhandlungs-Formulierung in die Zwischenablage kopiert!");
  }

  const scoreColor =
    auditResult.safetyScore >= 80
      ? "text-emerald-500"
      : auditResult.safetyScore >= 50
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-500" />
                IT-Arbeitsvertrags-Check & Klausel-Prüfer
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vertragsangebot für <strong>{position}</strong> bei <strong>{companyName}</strong> prüfen.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-surface-hover/60 border border-border px-3 py-1.5 rounded-xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Vertragssicherheit</span>
                <span className={`text-xl font-extrabold ${scoreColor}`}>
                  {auditResult.safetyScore}%
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Prüfe die Klauseln in deinem Entwurf. Bei roten Flaggen erhältst du erprobte Gegenargumente, die du diplomatisch per E-Mail ansprechen kannst, ohne dein Angebot zu gefährden.
            </p>
          </div>

          <div className="space-y-2">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              const isPassed = item.status === "PASSED";
              const isFailed = item.status === "FAILED";

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all ${
                    isFailed
                      ? "border-rose-500/40 bg-rose-500/5"
                      : isPassed
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-surface"
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : isFailed ? (
                        <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                      ) : (
                        <HelpCircle className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(item.id, isPassed ? "UNCHECKED" : "PASSED")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            isPassed
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "border-border bg-surface text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
                          }`}
                        >
                          Fair / OK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(item.id, isFailed ? "UNCHECKED" : "FAILED")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            isFailed
                              ? "bg-rose-600 text-white border-rose-600"
                              : "border-border bg-surface text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                          }`}
                        >
                          Kritisch
                        </button>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-border/40 text-xs space-y-3 animate-fade-in">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rechtlicher Hintergrund</span>
                        <p className="text-muted-foreground leading-relaxed">{item.legalContext}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                          <span className="font-bold block mb-0.5">⚠️ Typische Red-Flag Klausel:</span>
                          <span className="italic">{item.redFlagPattern}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                          <span className="font-bold block mb-0.5">✅ Faire Empfehlung:</span>
                          <span className="italic">{item.recommendedClause}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-surface-hover/60 border border-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Diplomatische Verhandlungs-Formulierung</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyScript(item)}
                            className="h-6 text-[10px] px-2 text-primary"
                          >
                            <Copy className="h-3 w-3 mr-1" /> Text kopieren
                          </Button>
                        </div>
                        <p className="italic text-[11.5px] text-foreground leading-relaxed">
                          {item.negotiationScript}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
