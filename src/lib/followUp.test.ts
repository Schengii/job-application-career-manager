import { describe, expect, it } from "vitest";
import { getFollowUpStatus, FOLLOW_UP_THRESHOLD_DAYS } from "./followUp";

describe("getFollowUpStatus", () => {
  it("schlägt Nachfassen vor, wenn eine versendete Bewerbung älter als 14 Tage ist", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - (FOLLOW_UP_THRESHOLD_DAYS + 2));

    const status = getFollowUpStatus({
      status: "SENT",
      applicationDate: oldDate,
    });

    expect(status.isFollowUpSuggested).toBe(true);
    expect(status.daysSinceApplication).toBeGreaterThanOrEqual(14);
  });

  it("schlägt KEIN Nachfassen vor bei frischen Bewerbungen oder Entwürfen", () => {
    const freshDate = new Date();
    freshDate.setDate(freshDate.getDate() - 3);

    const statusDraft = getFollowUpStatus({
      status: "DRAFT",
      applicationDate: freshDate,
    });
    expect(statusDraft.isFollowUpSuggested).toBe(false);

    const statusSentFresh = getFollowUpStatus({
      status: "SENT",
      applicationDate: freshDate,
    });
    expect(statusSentFresh.isFollowUpSuggested).toBe(false);
  });

  it("erkennt überfällige und bevorstehende Termine", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const statusPast = getFollowUpStatus({
      status: "INTERVIEW",
      nextStepDate: pastDate,
    });
    expect(statusPast.isOverdue).toBe(true);

    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 2);

    const statusSoon = getFollowUpStatus({
      status: "INTERVIEW",
      nextStepDate: soonDate,
    });
    expect(statusSoon.isDueSoon).toBe(true);
    expect(statusSoon.isOverdue).toBe(false);
  });
});
