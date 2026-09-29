"use client";

// -----------------------------------------------------------------------------
// "Heute"-Karte — konsolidierte Tagesübersicht für das Dashboard
// -----------------------------------------------------------------------------
// Fasst überfällige Nachfass-Aktionen, anstehende Termine (7 Tage) und neue
// E-Mail-Rückmeldungen in EINER Karte mit drei Tabs zusammen, statt dass der
// Nutzer jede Bewerbung einzeln aufrufen oder mehrere verstreute Bereiche
// prüfen muss. Nutzt dieselbe (bereits geladene) Application-Liste wie der
// Rest des Dashboards — kein zusätzlicher API-Call.
// -----------------------------------------------------------------------------
import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  MailQuestion,
  Video,
  X,
  XCircle,
  PartyPopper,
  Users,
  FileText,
} from "lucide-react";
import type { ApplicationListItem } from "@/types";
import { getTodayOverview } from "@/lib/applications/todayOverview";
import { useDismissedNotifications } from "@/lib/applications/useDismissedNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/core/utils";
import type { AppNotification } from "@/lib/applications/notifications";
import { buildInterviewDayData, type InterviewDayData } from "@/lib/interview/interviewDaySheet";
import { InterviewDaySheetModal } from "@/components/interview/interview-day-sheet-modal";

type TabKey = "followups" | "interviews" | "responses";

const RESPONSE_ICONS: Record<string, typeof XCircle> = {
  REJECTED: XCircle,
  OFFER: PartyPopper,
  INTERVIEW: Users,
};

const RESPONSE_STYLES: Record<string, string> = {
  REJECTED: "border-slate-400/30 bg-slate-400/5 text-slate-500",
  OFFER: "border-emerald-500/30 bg-emerald-500/5 text-emerald-500",
  INTERVIEW: "border-violet-500/30 bg-violet-500/5 text-violet-500",
};

export function TodayOverviewCard({ applications }: { applications: ApplicationListItem[] }) {
  const { dismissedIds, dismiss } = useDismissedNotifications();
  const overview = getTodayOverview(applications, dismissedIds);
  const [activeTab, setActiveTab] = useState<TabKey>(() => firstNonEmptyTab(overview));
  const [quickSheetData, setQuickSheetData] = useState<InterviewDayData | null>(null);

  if (overview.totalCount === 0) return null;

  function openQuickSheet(applicationId: string) {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;
    const data = buildInterviewDayData(app);
    setQuickSheetData(data);
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "followups", label: "Fällige Aktionen", count: overview.overdueFollowUps.length },
    { key: "interviews", label: "Anstehende Termine", count: overview.upcomingInterviews.length },
    { key: "responses", label: "Neue Rückmeldungen", count: overview.emailSuggestions.length },
  ];

  // Falls der aktuell aktive Tab leer ist (z.B. nach dem Ausblenden aller
  // Einträge), auf den nächsten nicht-leeren Tab wechseln statt eine leere
  // Ansicht zu zeigen.
  const effectiveTab = tabs.find((t) => t.key === activeTab && t.count > 0)?.key ?? firstNonEmptyTab(overview);

  return (
    <>
      <Card data-testid="today-overview-card" className="border-primary/40 bg-primary-soft/5 shadow-xs animate-scale-in">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <AlertCircle className="h-5 w-5 text-primary" /> Heute ({overview.totalCount})
          </CardTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                disabled={tab.count === 0}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  effectiveTab === tab.key
                    ? "border-primary bg-primary text-white"
                    : tab.count === 0
                      ? "border-border text-muted-foreground/50 cursor-not-allowed"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {effectiveTab === "followups" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.overdueFollowUps.slice(0, 6).map((item) => (
                <div
                  key={item.applicationId}
                  className="flex flex-col justify-between rounded-lg border border-orange-500/30 bg-surface p-3.5 card-hover-effect hover:border-orange-500/60"
                >
                  <Link href={`/applications/${item.applicationId}`}>
                    <p className="text-sm font-semibold text-foreground truncate">{item.companyName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.position}</p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    {item.nextStepDate ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold truncate">
                        ● Termin überfällig ({formatDate(item.nextStepDate)})
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium flex items-center gap-1 truncate">
                        <MailQuestion className="h-3 w-3 shrink-0" /> Seit {item.daysSinceApplication} Tagen offen
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => openQuickSheet(item.applicationId)}
                      className="ml-2 inline-flex items-center gap-1 rounded bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-primary-soft hover:text-primary transition-colors shrink-0"
                      title="Quick-Sheet Spickzettel öffnen"
                    >
                      <FileText className="h-3 w-3" /> Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {effectiveTab === "interviews" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.upcomingInterviews.slice(0, 6).map((item) => (
                <div
                  key={item.applicationId}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-sky-500/30 bg-surface p-3.5 card-hover-effect hover:border-sky-500/60"
                >
                  <Link href={`/applications/${item.applicationId}`} className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.companyName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.nextStep || item.position}</p>
                    <p className="mt-1 text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <CalendarClock className="h-3 w-3 shrink-0" />
                      {item.daysUntil === 0 ? "Heute" : item.daysUntil === 1 ? "Morgen" : `in ${item.daysUntil} Tagen`} — {formatDate(item.nextStepDate)}
                    </p>
                  </Link>

                  {/* Schnellzugriffsleiste für Termine */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                    <button
                      type="button"
                      onClick={() => openQuickSheet(item.applicationId)}
                      className="flex items-center gap-1 rounded-md border border-border bg-surface-hover px-2 py-1 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary-soft hover:text-primary transition-colors"
                      title="Vorbereitungs-Spickzettel (Gegenfragen, Skills, Notizen)"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span>Spickzettel 📋</span>
                    </button>

                    {item.meetingUrl && (
                      <a
                        href={item.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-7 items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                        title="Direkt zum Video-Meeting"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Meeting</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {effectiveTab === "responses" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.emailSuggestions.slice(0, 6).map((notif: AppNotification) => {
                const Icon = RESPONSE_ICONS[notif.type] ?? XCircle;
                return (
                  <div
                    key={notif.id}
                    className={`relative flex items-start gap-2.5 rounded-lg border p-3.5 card-hover-effect ${RESPONSE_STYLES[notif.type] ?? ""}`}
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
          )}
        </CardContent>
      </Card>

      {/* Quick-Sheet Modal direkt aus dem Dashboard aufrufbar */}
      <InterviewDaySheetModal
        open={Boolean(quickSheetData)}
        onClose={() => setQuickSheetData(null)}
        data={quickSheetData}
      />
    </>
  );
}

function firstNonEmptyTab(overview: ReturnType<typeof getTodayOverview>): TabKey {
  if (overview.overdueFollowUps.length > 0) return "followups";
  if (overview.upcomingInterviews.length > 0) return "interviews";
  return "responses";
}
