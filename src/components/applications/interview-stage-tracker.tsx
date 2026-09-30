"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import {
  INTERVIEW_PIPELINE_STAGES,
  getStageOrder,
} from "@/lib/applications/interviewStages";
import { apiPut } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";

interface InterviewStageTrackerProps {
  applicationId: string;
  currentStage: string | null | undefined;
  onStageChanged?: () => void;
}

export function InterviewStageTracker({
  applicationId,
  currentStage,
  onStageChanged,
}: InterviewStageTrackerProps) {
  const toast = useToast();
  const [updating, setUpdating] = useState(false);
  const currentOrder = getStageOrder(currentStage);

  async function handleSelectStage(stageId: string) {
    if (updating) return;
    setUpdating(true);
    try {
      // Wenn man auf das aktuelle klickt, optional leeren oder neu setzen
      const nextValue = currentStage === stageId ? null : stageId;
      await apiPut(`/api/applications/${applicationId}`, {
        interviewStage: nextValue,
      });
      toast.success(
        nextValue
          ? `Interview-Phase auf „${INTERVIEW_PIPELINE_STAGES.find((s) => s.id === stageId)?.label}“ aktualisiert!`
          : "Interview-Phase zurückgesetzt."
      );
      onStageChanged?.();
    } catch {
      toast.error("Aktualisieren der Interview-Phase fehlgeschlagen.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" /> Interview-Phasen & Pipeline-Fortschritt
        </h4>
        <span className="text-[11px] text-muted-foreground">
          {currentStage
            ? INTERVIEW_PIPELINE_STAGES.find((s) => s.id === currentStage)?.description
            : "Klicke auf eine Etappe, um den aktuellen Status festzulegen"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {INTERVIEW_PIPELINE_STAGES.map((stage) => {
          const isCurrent = currentStage === stage.id;
          const isPassed = currentOrder > stage.order;

          return (
            <button
              key={stage.id}
              type="button"
              disabled={updating}
              onClick={() => handleSelectStage(stage.id)}
              className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative ${
                isCurrent
                  ? "border-primary bg-primary-soft/60 shadow-xs ring-1 ring-primary"
                  : isPassed
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                  : "border-border bg-surface-hover/30 hover:bg-surface-hover text-muted-foreground opacity-80"
              }`}
              title={stage.description}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Stufe {stage.order}
                </span>
                {isPassed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : isCurrent ? (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </div>
              <p className={`text-xs font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                {stage.label.split(". ")[1]}
              </p>
              <span className="text-[10px] text-muted-foreground mt-1">
                ⏱️ {stage.typicalDuration}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
