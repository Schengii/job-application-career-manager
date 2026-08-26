"use client";

// -----------------------------------------------------------------------------
// "Neue Rückmeldungen"-Karte für das Dashboard
// -----------------------------------------------------------------------------
// Zeigt Absagen, Zusagen & Interview-Einladungen (dieselbe Herleitung wie die
// Notification-Bell, siehe src/lib/notifications.ts) direkt auf dem
// Dashboard an, damit Rückmeldungen nicht erst über die Glocke aufgerufen
// werden müssen — alle wichtigen Infos sollen an einem Ort sichtbar sein.
// -----------------------------------------------------------------------------
import Link from "next/link";
import { XCircle, PartyPopper, Users, X } from "lucide-react";
import type { ApplicationListItem } from "@/types";
import { getNotificationsFromApplications, type AppNotification } from "@/lib/notifications";
import { useDismissedNotifications } from "@/lib/useDismissedNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_TYPES: AppNotification["type"][] = ["REJECTED", "OFFER", "INTERVIEW"];

const ICONS: Record<string, typeof XCircle> = {
  REJECTED: XCircle,
  OFFER: PartyPopper,
  INTERVIEW: Users,
};

const STYLES: Record<string, string> = {
  REJECTED: "border-slate-400/30 bg-slate-400/5 text-slate-500",
  OFFER: "border-emerald-500/30 bg-emerald-500/5 text-emerald-500",
  INTERVIEW: "border-violet-500/30 bg-violet-500/5 text-violet-500",
};

export function RecentResponsesCard({ applications }: { applications: ApplicationListItem[] }) {
  const { dismissedIds, dismiss } = useDismissedNotifications();

  const responses = getNotificationsFromApplications(applications, dismissedIds).filter((n) =>
    STATUS_TYPES.includes(n.type)
  );

  if (responses.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary-soft/10 shadow-xs animate-scale-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          Neue Rückmeldungen ({responses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {responses.slice(0, 6).map((notif) => {
            const Icon = ICONS[notif.type] ?? XCircle;
            return (
              <div
                key={notif.id}
                className={`relative flex items-start gap-2.5 rounded-lg border p-3.5 card-hover-effect ${STYLES[notif.type] ?? ""}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <Link href={`/applications/${notif.applicationId}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{notif.companyName}</p>
                  <p className="truncate text-xs text-muted-foreground">{notif.position}</p>
                  <p className="mt-1 text-xs font-medium">{notif.title}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => dismiss(notif.id)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Benachrichtigung ausblenden"
                  title="Ausblenden"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
