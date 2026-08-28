"use client";

// -----------------------------------------------------------------------------
// Quick-Snooze & Wiedervorlage-Buttons (+3 Tage, +1 Woche, +2 Wochen)
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";

export function FollowUpSnoozeButtons({
  applicationId,
  currentNextStepDate,
  onSnoozed,
}: {
  applicationId: string;
  currentNextStepDate?: Date | string | null;
  onSnoozed?: (newDate: Date) => void;
}) {
  const toast = useToast();
  const [loadingDays, setLoadingDays] = useState<number | null>(null);

  async function handleSnooze(days: number) {
    setLoadingDays(days);
    try {
      const res = await apiPost<{ success: boolean; nextStepDate: string; message: string }>(
        `/api/applications/${applicationId}/snooze`,
        { days }
      );
      toast.success(res.message || `Wiedervorlage um +${days} Tage verschoben.`);
      if (onSnoozed) {
        onSnoozed(new Date(res.nextStepDate));
      }
    } catch {
      toast.error("Verschieben fehlgeschlagen.");
    } finally {
      setLoadingDays(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground font-medium flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 text-primary" /> Wiedervorlage:
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loadingDays !== null}
        onClick={() => handleSnooze(3)}
        className="h-6 px-2 text-[10.5px] rounded-md"
      >
        {loadingDays === 3 ? "..." : "+3 Tage"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loadingDays !== null}
        onClick={() => handleSnooze(7)}
        className="h-6 px-2 text-[10.5px] rounded-md"
      >
        {loadingDays === 7 ? "..." : "+1 Woche"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loadingDays !== null}
        onClick={() => handleSnooze(14)}
        className="h-6 px-2 text-[10.5px] rounded-md"
      >
        {loadingDays === 14 ? "..." : "+2 Wochen"}
      </Button>
    </div>
  );
}
