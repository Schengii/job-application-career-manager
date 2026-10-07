"use client";

import { useMemo } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { evaluateGhostingStatus, ApplicationGhostingInput } from "@/lib/applications/ghostingRadar";

interface GhostingRadarBadgeProps {
  application: ApplicationGhostingInput;
  showIcon?: boolean;
  className?: string;
}

export function GhostingRadarBadge({
  application,
  showIcon = true,
  className = "",
}: GhostingRadarBadgeProps) {
  const status = useMemo(() => evaluateGhostingStatus(application), [application]);

  // Wenn keine Aktion erforderlich ist und wir uns nicht im warning/danger Bereich befinden
  if (status.level === "normal") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${status.badgeColor} ${className}`}
        title={`${status.daysWaiting} Tage seit letztem Statuswechsel – ${status.recommendedAction}`}
      >
        {showIcon && <CheckCircle2 className="h-2.5 w-2.5 opacity-70" />}
        <span>{status.daysWaiting}d aktiv</span>
      </span>
    );
  }

  const isDanger = status.level === "danger";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-all ${status.badgeColor} ${
        isDanger ? "animate-pulse ring-1 ring-red-500/30" : ""
      } ${className}`}
      title={`${status.badgeLabel} – Empfehlung: ${status.recommendedAction}`}
    >
      {showIcon && (
        isDanger ? (
          <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 shrink-0" />
        ) : (
          <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
        )
      )}
      <span className="truncate">{status.badgeLabel}</span>
    </span>
  );
}
