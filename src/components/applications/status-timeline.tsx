import { ApplicationStatusBadge } from "@/components/status-badge";
import { formatDateTime, cn } from "@/lib/utils";
import type { ApplicationStatusEvent } from "@/types";

const STATUS_DOT_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-400 ring-4 ring-slate-400/20",
  SENT: "bg-amber-500 ring-4 ring-amber-500/20",
  INTERVIEW: "bg-sky-500 ring-4 ring-sky-500/20",
  OFFER: "bg-emerald-500 ring-4 ring-emerald-500/20",
  REJECTED: "bg-rose-500 ring-4 ring-rose-500/20",
  WITHDRAWN: "bg-gray-400 ring-4 ring-gray-400/20",
};

export function StatusTimeline({ events }: { events: ApplicationStatusEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Ereignisse protokolliert.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, i) => {
        const dotColor = STATUS_DOT_COLORS[event.status] || "bg-primary ring-4 ring-primary/20";

        return (
          <li key={event.id} className="relative flex gap-3.5 pl-1">
            <div className="flex flex-col items-center pt-1">
              <span className={cn("h-3 w-3 rounded-full shrink-0", dotColor)} />
              {i < events.length - 1 && <span className="mt-2 w-0.5 flex-1 bg-border" />}
            </div>
            <div className="pb-2 flex-1">
              <ApplicationStatusBadge status={event.status} />
              {event.note && (
                <p className="mt-1.5 text-sm text-foreground bg-surface-hover/50 p-2 rounded-lg border border-border/50">
                  {event.note}
                </p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(event.changedAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
