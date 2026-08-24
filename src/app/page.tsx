"use client";

import useSWR from "swr";
import Link from "next/link";
import { Briefcase, Inbox, CalendarClock, ThumbsDown, PartyPopper, ArrowRight } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem, Metrics } from "@/types";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useSWR<Metrics>("/api/metrics", fetcher, {
    refreshInterval: 15000,
  });
  const { data: applications, isLoading: appsLoading } = useSWR<ApplicationListItem[]>(
    "/api/applications",
    fetcher,
  );

  const recent = applications?.slice(0, 6) ?? [];
  const upcoming = (applications ?? [])
    .filter((a) => a.nextStepDate)
    .sort((a, b) => new Date(a.nextStepDate!).getTime() - new Date(b.nextStepDate!).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Überblick über deine Jobsuche als Fachinformatiker für Anwendungsentwicklung.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Bewerbungen gesamt" value={metrics?.total ?? 0} icon={Briefcase} accent="primary" loading={metricsLoading} />
        <MetricCard label="Offene Bewerbungen" value={metrics?.open ?? 0} icon={Inbox} accent="info" loading={metricsLoading} />
        <MetricCard label="Gespräche" value={metrics?.interview ?? 0} icon={CalendarClock} accent="warning" loading={metricsLoading} />
        <MetricCard label="Absagen" value={metrics?.rejected ?? 0} icon={ThumbsDown} accent="danger" loading={metricsLoading} />
        <MetricCard label="Zusagen" value={metrics?.offer ?? 0} icon={PartyPopper} accent="success" loading={metricsLoading} />
      </div>

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
            <CardTitle>Nächste Schritte</CardTitle>
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
    </div>
  );
}
