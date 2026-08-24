import { ApplicationStatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/utils";
import type { ApplicationStatusEvent } from "@/types";

export function StatusTimeline({ events }: { events: ApplicationStatusEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Ereignisse protokolliert.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, i) => (
        <li key={event.id} className="relative flex gap-3 pl-1">
          <div className="flex flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="pb-1">
            <ApplicationStatusBadge status={event.status} />
            {event.note && <p className="mt-1 text-sm text-foreground">{event.note}</p>}
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.changedAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
