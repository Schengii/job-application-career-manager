// -----------------------------------------------------------------------------
// "Heute"-Übersicht — konsolidierte Aggregation für das Dashboard
// -----------------------------------------------------------------------------
// Fasst die drei wichtigsten tagesaktuellen Handlungsfelder an einer Stelle
// zusammen, die bisher verstreut waren (Follow-up-Banner, Termine-Liste,
// Rückmeldungen-Karte / einzelne Bewerbungsseiten):
//   1. Überfällige Nachfass-Aktionen (siehe src/lib/followUp.ts)
//   2. Anstehende Termine/Interviews in den nächsten 7 Tagen
//   3. Neue E-Mail-Rückmeldungen, die noch nicht gesichtet wurden
//      (abgeleitet wie die Notification-Bell, siehe src/lib/notifications.ts)
//
// Reine Aggregations-Logik ohne eigenen Datenabruf — die Applications werden
// von der aufrufenden Seite bereits per SWR geladen (kein zusätzlicher
// API-Call nötig).
// -----------------------------------------------------------------------------
import { getFollowUpStatus } from "./followUp";
import { getNotificationsFromApplications, type NotificationSourceApplication, type AppNotification } from "./notifications";

export const UPCOMING_INTERVIEW_WINDOW_DAYS = 7;

export type OverdueFollowUpItem = {
  applicationId: string;
  companyName: string;
  position: string;
  nextStepDate: string | null;
  daysSinceApplication: number | null;
  isFollowUpSuggested: boolean;
};

export type UpcomingInterviewItem = {
  applicationId: string;
  companyName: string;
  position: string;
  nextStep: string | null;
  nextStepDate: string;
  daysUntil: number;
  meetingUrl: string | null;
};

export type TodayOverview = {
  overdueFollowUps: OverdueFollowUpItem[];
  upcomingInterviews: UpcomingInterviewItem[];
  emailSuggestions: AppNotification[];
  totalCount: number;
};

export type TodayOverviewApplication = NotificationSourceApplication & {
  id: string;
  meetingUrl?: string | null;
};

/**
 * Aggregiert Follow-up-, Termin- und Rückmeldungs-Daten aus einer bereits
 * geladenen Application-Liste zu einer konsolidierten "Heute"-Sicht.
 */
export function getTodayOverview(
  applications: TodayOverviewApplication[],
  dismissedIds: string[] = []
): TodayOverview {
  const overdueFollowUps: OverdueFollowUpItem[] = [];
  const upcomingInterviews: UpcomingInterviewItem[] = [];

  for (const app of applications) {
    const followUp = getFollowUpStatus(app);

    // 1. Überfällige Nachfass-Aktionen: entweder ein überfälliger Termin oder
    // eine seit >14 Tagen unbeantwortete Bewerbung (siehe getFollowUpStatus).
    if (followUp.isOverdue || followUp.isFollowUpSuggested) {
      overdueFollowUps.push({
        applicationId: app.id,
        companyName: app.company.name,
        position: app.position,
        nextStepDate: app.nextStepDate ? new Date(app.nextStepDate).toISOString() : null,
        daysSinceApplication: followUp.daysSinceApplication,
        isFollowUpSuggested: followUp.isFollowUpSuggested,
      });
    }

    // 2. Anstehende Termine/Interviews in den nächsten 7 Tagen (inkl. heute,
    // exkl. bereits überfällige — die stehen bereits in Sektion 1).
    if (
      app.nextStepDate &&
      followUp.daysUntilNextStep !== null &&
      followUp.daysUntilNextStep >= 0 &&
      followUp.daysUntilNextStep <= UPCOMING_INTERVIEW_WINDOW_DAYS
    ) {
      upcomingInterviews.push({
        applicationId: app.id,
        companyName: app.company.name,
        position: app.position,
        nextStep: app.nextStep ?? null,
        nextStepDate: new Date(app.nextStepDate).toISOString(),
        daysUntil: followUp.daysUntilNextStep,
        meetingUrl: app.meetingUrl ?? null,
      });
    }
  }

  overdueFollowUps.sort((a, b) => (b.daysSinceApplication ?? 0) - (a.daysSinceApplication ?? 0));
  upcomingInterviews.sort((a, b) => a.daysUntil - b.daysUntil);

  // 3. Neue E-Mail-Rückmeldungen, die noch nicht gesichtet/ausgeblendet wurden
  // (Absage/Zusage/Interview-Einladung — dieselbe Herleitung wie die
  // Notification-Bell & RecentResponsesCard).
  const emailSuggestions = getNotificationsFromApplications(applications, dismissedIds).filter((n) =>
    (["REJECTED", "OFFER", "INTERVIEW"] as AppNotification["type"][]).includes(n.type)
  );

  return {
    overdueFollowUps,
    upcomingInterviews,
    emailSuggestions,
    totalCount: overdueFollowUps.length + upcomingInterviews.length + emailSuggestions.length,
  };
}
