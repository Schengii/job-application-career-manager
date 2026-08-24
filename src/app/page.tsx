"use client";

import useSWR from "swr";
import Link from "next/link";
import {
  Briefcase,
  Inbox,
  CalendarClock,
  ThumbsDown,
  PartyPopper,
  ArrowRight,
  AlertCircle,
  MailQuestion,
  Mail,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem, Metrics } from "@/types";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { getFollowUpStatus } from "@/lib/followUp";
import { EmailResponseModal } from "@/components/applications/email-response-modal";
import { CalendarFeedModal } from "@/components/calendar/calendar-feed-modal";

export default function DashboardPage() {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const { data: metrics, isLoading: metricsLoading, mutate: mutateMetrics } = useSWR<Metrics>("/api/metrics", fetcher, {
    refreshInterval: 15000,
  });
  const { data: applications, isLoading: appsLoading, mutate: mutateApps } = useSWR<ApplicationListItem[]>(
    "/api/applications",
    fetcher,
  );

  const recent = applications?.slice(0, 6) ?? [];

  // Berechne anstehende Termine & fällige Nachfass-Aktionen
  const followUpItems = (applications ?? [])
    .map((app) => ({
      app,
      followUp: getFollowUpStatus(app),
    }))
    .filter(({ followUp }) => followUp.isOverdue || followUp.isDueSoon || followUp.isFollowUpSuggested);

  const upcoming = (applications ?? [])
    .filter((a) => a.nextStepDate)
    .sort((a, b) => new Date(a.nextStepDate!).getTime() - new Date(b.nextStepDate!).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Überblick über deine Jobsuche als Fachinformatiker für Anwendungsentwicklung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCalendarModalOpen(true)} className="card-hover-effect">
            <Calendar className="h-4 w-4 text-sky-500" /> Kalender-Abo (.ics)
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEmailModalOpen(true)} className="card-hover-effect">
            <Mail className="h-4 w-4" /> E-Mail erfassen
          </Button>
        </div>
      </header>

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Bewerbungen gesamt" value={metrics?.total ?? 0} icon={Briefcase} accent="primary" loading={metricsLoading} />
        <MetricCard label="Offene Bewerbungen" value={metrics?.open ?? 0} icon={Inbox} accent="yellow" loading={metricsLoading} />
        <MetricCard label="Gespräche" value={metrics?.interview ?? 0} icon={CalendarClock} accent="blue" loading={metricsLoading} />
        <MetricCard label="Absagen" value={metrics?.rejected ?? 0} icon={ThumbsDown} accent="red" loading={metricsLoading} />
        <MetricCard label="Zusagen" value={metrics?.offer ?? 0} icon={PartyPopper} accent="green" loading={metricsLoading} />
      </div>

      {/* Follow-up / Wiedervorlage Banner */}
      {followUpItems.length > 0 && (
        <Card className="border-orange-500/40 bg-orange-500/5 dark:bg-orange-500/10 shadow-xs animate-scale-in">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold text-base">
              <AlertCircle className="h-5 w-5 text-orange-500 animate-pulse-subtle" /> Fällige Aktionen & Nachfass-Erinnerungen ({followUpItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {followUpItems.slice(0, 6).map(({ app, followUp }) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex flex-col justify-between rounded-lg border border-orange-500/30 bg-surface p-3.5 card-hover-effect hover:border-orange-500/60"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-semibold text-foreground truncate">{app.company.name}</p>
                      {followUp.isFollowUpSuggested && (
                        <span className="shrink-0 flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                          <MailQuestion className="h-3 w-3" /> Nachfassen!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{app.position}</p>
                  </div>
                  <div className="mt-3 text-xs pt-2 border-t border-border/50">
                    {followUp.isOverdue && (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        ● Termin überfällig ({formatDate(app.nextStepDate)})
                      </span>
                    )}
                    {followUp.isDueSoon && !followUp.isOverdue && (
                      <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                        ● Termin in Kürze: {formatDate(app.nextStepDate)}
                      </span>
                    )}
                    {followUp.isFollowUpSuggested && (
                      <span className="text-muted-foreground font-medium">
                        Seit {followUp.daysSinceApplication} Tagen keine Rückmeldung
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hauptbereich */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Neueste Bewerbungen</CardTitle>
            <Link href="/applications" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Alle ansehen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {appsLoading && <p className="text-sm text-muted-foreground">Lade Bewerbungen …</p>}
            {!appsLoading && recent.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Bewerbungen vorhanden. Lege deine erste Bewerbung an oder nutze die Jobsuche.
              </p>
            )}
            <ul className="divide-y divide-border">
              {recent.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{app.position}</p>
                      <p className="truncate text-xs text-muted-foreground">{app.company.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {formatDate(app.applicationDate)}
                      </span>
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nächste Schritte & Termine</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">Aktuell keine anstehenden Termine hinterlegt.</p>
            )}
            <ul className="flex flex-col gap-3">
              {upcoming.map((app) => (
                <li key={app.id}>
                  <Link href={`/applications/${app.id}`} className="block rounded-lg border border-border p-3 hover:bg-surface-hover">
                    <p className="text-sm font-medium text-foreground">{app.company.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{app.nextStep}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{formatDate(app.nextStepDate)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <EmailResponseModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onUpdated={() => {
          mutateApps();
          mutateMetrics();
        }}
      />

      <CalendarFeedModal
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
      />
    </div>
  );
}
