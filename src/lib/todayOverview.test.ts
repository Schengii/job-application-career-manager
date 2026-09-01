import { describe, expect, it } from "vitest";
import { getTodayOverview, UPCOMING_INTERVIEW_WINDOW_DAYS, type TodayOverviewApplication } from "./todayOverview";
import { FOLLOW_UP_THRESHOLD_DAYS } from "./followUp";

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function makeApp(overrides: Partial<TodayOverviewApplication> & { id: string }): TodayOverviewApplication {
  return {
    id: overrides.id,
    status: overrides.status ?? "SENT",
    position: overrides.position ?? "Frontend-Entwickler",
    applicationDate: overrides.applicationDate ?? new Date(),
    nextStep: overrides.nextStep ?? null,
    nextStepDate: overrides.nextStepDate ?? null,
    meetingUrl: overrides.meetingUrl ?? null,
    company: overrides.company ?? { name: "Muster GmbH" },
    statusEvents: overrides.statusEvents ?? [],
  } as TodayOverviewApplication;
}

describe("getTodayOverview", () => {
  it("liefert leere Listen bei leerer Application-Liste", () => {
    const overview = getTodayOverview([]);
    expect(overview.totalCount).toBe(0);
    expect(overview.overdueFollowUps).toEqual([]);
    expect(overview.upcomingInterviews).toEqual([]);
    expect(overview.emailSuggestions).toEqual([]);
  });

  it("erkennt überfällige Termine als fällige Nachfass-Aktion", () => {
    const app = makeApp({
      id: "1",
      nextStepDate: addDays(-3),
      nextStep: "Rückmeldung abwarten",
    });
    const overview = getTodayOverview([app]);
    expect(overview.overdueFollowUps).toHaveLength(1);
    expect(overview.overdueFollowUps[0].applicationId).toBe("1");
    expect(overview.overdueFollowUps[0].companyName).toBe("Muster GmbH");
  });

  it("erkennt lange unbeantwortete Bewerbungen (>= Schwelle) als fällige Nachfass-Aktion", () => {
    const oldDate = addDays(-(FOLLOW_UP_THRESHOLD_DAYS + 1));
    const app = makeApp({ id: "2", status: "SENT", applicationDate: oldDate });
    const overview = getTodayOverview([app]);
    expect(overview.overdueFollowUps).toHaveLength(1);
    expect(overview.overdueFollowUps[0].isFollowUpSuggested).toBe(true);
  });

  it("gruppiert Termine innerhalb der nächsten 7 Tage als anstehende Termine", () => {
    const inWindow = makeApp({ id: "3", nextStepDate: addDays(UPCOMING_INTERVIEW_WINDOW_DAYS - 1) });
    const tooFar = makeApp({ id: "4", nextStepDate: addDays(UPCOMING_INTERVIEW_WINDOW_DAYS + 5) });
    const overview = getTodayOverview([inWindow, tooFar]);

    expect(overview.upcomingInterviews).toHaveLength(1);
    expect(overview.upcomingInterviews[0].applicationId).toBe("3");
  });

  it("zählt überfällige Termine NICHT zusätzlich als anstehende Termine", () => {
    const overdue = makeApp({ id: "5", nextStepDate: addDays(-1) });
    const overview = getTodayOverview([overdue]);

    expect(overview.overdueFollowUps).toHaveLength(1);
    expect(overview.upcomingInterviews).toHaveLength(0);
  });

  it("sortiert anstehende Termine nach Dringlichkeit (nächster zuerst)", () => {
    const later = makeApp({ id: "6", nextStepDate: addDays(5) });
    const sooner = makeApp({ id: "7", nextStepDate: addDays(1) });
    const overview = getTodayOverview([later, sooner]);

    expect(overview.upcomingInterviews.map((i) => i.applicationId)).toEqual(["7", "6"]);
  });

  it("übernimmt neue E-Mail-Rückmeldungen (Absage/Zusage/Interview) unverändert aus getNotificationsFromApplications", () => {
    const app = makeApp({
      id: "8",
      status: "OFFER",
      statusEvents: [{ id: "evt-8", status: "OFFER", changedAt: new Date() }],
    });
    const overview = getTodayOverview([app]);

    expect(overview.emailSuggestions).toHaveLength(1);
    expect(overview.emailSuggestions[0].type).toBe("OFFER");
    expect(overview.emailSuggestions[0].applicationId).toBe("8");
  });

  it("respektiert ausgeblendete (dismissed) E-Mail-Rückmeldungen", () => {
    const app = makeApp({
      id: "9",
      status: "REJECTED",
      statusEvents: [{ id: "evt-9", status: "REJECTED", changedAt: new Date() }],
    });
    const overview = getTodayOverview([app], ["status-evt-9"]);

    expect(overview.emailSuggestions).toHaveLength(0);
  });

  it("berechnet totalCount als Summe aller drei Kategorien", () => {
    const apps = [
      makeApp({ id: "10", nextStepDate: addDays(-1) }), // overdue
      makeApp({ id: "11", nextStepDate: addDays(2) }), // upcoming
      makeApp({
        id: "12",
        status: "INTERVIEW",
        statusEvents: [{ id: "evt-12", status: "INTERVIEW", changedAt: new Date() }],
      }), // response
    ];
    const overview = getTodayOverview(apps);
    expect(overview.totalCount).toBe(3);
  });
});
