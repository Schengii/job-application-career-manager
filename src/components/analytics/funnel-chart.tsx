"use client";

// -----------------------------------------------------------------------------
// Funnel / Bewerbungstrichter Chart mit Branchen-Benchmarking & KI-Diagnose
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, Info, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeFunnelDiagnostics } from "@/lib/funnelDiagnostics";

type FunnelStep = {
  stage: string;
  count: number;
  rate: number;
};

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  const [showBenchmark, setShowBenchmark] = useState(false);

  // Extrahiere Metrics aus den FunnelSteps
  const metrics = useMemo(() => {
    const total = data.find((d) => d.stage.toLowerCase().includes("gesamt"))?.count ??
                  Math.max(...data.map((d) => d.count), 0);
    const sent = data.find((d) => d.stage.toLowerCase().includes("gesendet"))?.count ?? 0;
    const interview = data.find((d) => d.stage.toLowerCase().includes("interview"))?.count ?? 0;
    const offer = data.find((d) => d.stage.toLowerCase().includes("angebot") || d.stage.toLowerCase().includes("offer"))?.count ?? 0;

    return {
      total,
      draft: 0,
      sent,
      interview,
      offer,
      rejected: 0,
    };
  }, [data]);

  const diagnostics = useMemo(() => {
    return analyzeFunnelDiagnostics(metrics);
  }, [metrics]);

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten für den Trichter vorhanden.</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Benchmark Toggle Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Pipeline-Phasen</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            Health: {diagnostics.pipelineHealthScore}%
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowBenchmark(!showBenchmark)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            showBenchmark
              ? "bg-primary text-white"
              : "border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          {showBenchmark ? "Benchmark aktiv" : "Mit Markt-Benchmark vergleichen"}
        </button>
      </div>

      {/* Funnel Steps */}
      <div className="flex flex-col gap-3.5">
        {data.map((step, idx) => {
          const widthPct = Math.max(12, Math.round((step.count / maxCount) * 100));
          const benchmarkPct = idx === 0 ? 100 : idx === 1 ? 25 : idx === 2 ? 8 : 4;

          return (
            <div key={step.stage} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-hover text-[11px] font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  {step.stage}
                </span>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-semibold text-foreground">{step.count}</span>
                  <span className="text-muted-foreground text-[11px]">({step.rate}%)</span>
                  {showBenchmark && (
                    <span className="text-[10px] text-primary font-bold">
                      [Markt: ~{benchmarkPct}%]
                    </span>
                  )}
                </div>
              </div>

              <div className="relative h-6 w-full rounded-md bg-surface-hover/70 overflow-hidden flex items-center p-0.5">
                <div
                  className={cn(
                    "h-full rounded transition-all duration-500 shadow-2xs",
                    idx === 0 && "bg-amber-500",
                    idx === 1 && "bg-indigo-500",
                    idx === 2 && "bg-sky-500",
                    idx === 3 && "bg-emerald-500"
                  )}
                  style={{ width: `${widthPct}%` }}
                />

                {/* Benchmark Marker Line */}
                {showBenchmark && (
                  <div
                    className="absolute top-0 bottom-0 border-r-2 border-dashed border-rose-500/80 z-10"
                    style={{ left: `${benchmarkPct}%` }}
                    title={`Branchen-Benchmark: ${benchmarkPct}%`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* KI-Erfolgsdiagnose Box */}
      {diagnostics.insights.length > 0 && (
        <div className="mt-2 rounded-xl border border-primary/20 bg-primary-soft/20 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Pipeline-Diagnose & Empfehlungen:
          </div>
          {diagnostics.insights.map((insight) => (
            <div key={insight.id} className="text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                {insight.type === "POSITIVE" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                {insight.type === "WARNING" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                {insight.type === "INFO" && <Info className="h-3.5 w-3.5 text-sky-500 shrink-0" />}
                <span>{insight.title}</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {insight.description}
              </p>
              <p className="text-primary text-[11px] font-medium leading-relaxed">
                💡 Tipp: {insight.actionRecommendation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
