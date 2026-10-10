"use client";

import React from "react";
import { checkSalaryTransparency } from "@/lib/jobs/salaryTransparency";
import { cn } from "@/lib/core/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SalaryTransparencyBadgeProps {
  salaryInfo?: string | null;
  description?: string | null;
  role?: string;
  className?: string;
  showBenchmarkNotice?: boolean;
}

export function SalaryTransparencyBadge({
  salaryInfo,
  description,
  role = "Frontend",
  className,
  showBenchmarkNotice = false,
}: SalaryTransparencyBadgeProps) {
  const result = checkSalaryTransparency(salaryInfo, description, role);

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
          result.badgeColor
        )}
        title={result.transparencyNotice}
      >
        {result.hasTransparentSalary ? (
          <CheckCircle2 className="h-3 w-3 shrink-0" />
        ) : (
          <AlertCircle className="h-3 w-3 shrink-0" />
        )}
        <span>{result.badgeLabel}</span>
      </div>

      {showBenchmarkNotice && !result.hasTransparentSalary && (
        <span className="text-[10px] text-muted-foreground">
          Richtwert: {result.benchmarkRangeText}
        </span>
      )}
    </div>
  );
}
