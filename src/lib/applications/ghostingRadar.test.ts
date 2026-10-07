import { describe, expect, it } from "vitest";
import { evaluateGhostingStatus, getGhostingOverview } from "./ghostingRadar";

describe("ghostingRadar", () => {
  const baseDate = new Date("2026-10-01T12:00:00Z");

  it("klassifiziert frische SENT-Bewerbung als normal (unter 14 Tage)", () => {
    const freshApp = {
      id: "app-1",
      status: "SENT",
      applicationDate: new Date("2026-09-26T12:00:00Z"), // 5 Tage her
    };
    const res = evaluateGhostingStatus(freshApp, baseDate);
    expect(res.level).toBe("normal");
    expect(res.daysWaiting).toBe(5);
    expect(res.isActionRequired).toBe(false);
  });

  it("erkennt 14+ Tage Warten als warning (Nachfassen fällig)", () => {
    const waitingApp = {
      id: "app-2",
      status: "SENT",
      applicationDate: new Date("2026-09-15T12:00:00Z"), // 16 Tage her
    };
    const res = evaluateGhostingStatus(waitingApp, baseDate);
    expect(res.level).toBe("warning");
    expect(res.daysWaiting).toBe(16);
    expect(res.isActionRequired).toBe(true);
    expect(res.suggestedTemplate).toBe("FRIENDLY_INQUIRY");
  });

  it("erkennt 30+ Tage Warten als hohes Ghosting-Risiko", () => {
    const ghostedApp = {
      id: "app-3",
      status: "SENT",
      applicationDate: new Date("2026-08-25T12:00:00Z"), // 37 Tage her
    };
    const res = evaluateGhostingStatus(ghostedApp, baseDate);
    expect(res.level).toBe("danger");
    expect(res.daysWaiting).toBe(37);
    expect(res.badgeLabel).toContain("Ghosting-Risiko");
    expect(res.suggestedTemplate).toBe("ARCHIVE");
  });

  it("erkennt überfälliges Feedback bei INTERVIEW-Status nach nächstem Schritt", () => {
    const interviewApp = {
      id: "app-4",
      status: "INTERVIEW",
      nextStepDate: new Date("2026-09-20T12:00:00Z"), // 11 Tage her
    };
    const res = evaluateGhostingStatus(interviewApp, baseDate);
    expect(res.level).toBe("danger");
    expect(res.badgeLabel).toContain("Feedback überfällig");
    expect(res.isActionRequired).toBe(true);
  });

  it("ignoriert DRAFT und REJECTED Bewerbungen", () => {
    const draftApp = {
      id: "app-5",
      status: "DRAFT",
      applicationDate: new Date("2026-08-01T12:00:00Z"),
    };
    const res = evaluateGhostingStatus(draftApp, baseDate);
    expect(res.level).toBe("normal");
    expect(res.isActionRequired).toBe(false);
  });

  it("aggregiert mehrere Bewerbungen mit getGhostingOverview", () => {
    const apps = [
      { id: "1", status: "SENT", applicationDate: new Date("2026-09-29T12:00:00Z") }, // normal
      { id: "2", status: "SENT", applicationDate: new Date("2026-09-10T12:00:00Z") }, // warning
      { id: "3", status: "SENT", applicationDate: new Date("2026-08-20T12:00:00Z") }, // danger
    ];
    const overview = getGhostingOverview(apps, baseDate);
    expect(overview.totalEvaluated).toBe(3);
    expect(overview.warningCount).toBe(1);
    expect(overview.dangerCount).toBe(1);
    expect(overview.actionRequiredCount).toBe(2);
    expect(overview.urgentApplications).toHaveLength(2);
  });
});
