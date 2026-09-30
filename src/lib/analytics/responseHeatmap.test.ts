import { describe, it, expect } from "vitest";
import {
  getTimeSlot,
  computeResponseTimingAnalytics,
} from "./responseHeatmap";

describe("responseHeatmap", () => {
  it("determines correct time slot from date", () => {
    expect(getTimeSlot(new Date("2026-03-02T08:30:00Z"))).toBe("MORNING");
    expect(getTimeSlot(new Date("2026-03-02T12:15:00Z"))).toBe("MIDDAY");
    expect(getTimeSlot(new Date("2026-03-02T15:00:00Z"))).toBe("AFTERNOON");
    expect(getTimeSlot(new Date("2026-03-02T21:00:00Z"))).toBe("EVENING");
  });

  it("handles empty application lists safely", () => {
    const res = computeResponseTimingAnalytics([]);
    expect(res.totalAnalyzed).toBe(0);
    expect(res.dayStats).toHaveLength(7);
    expect(res.slotStats).toHaveLength(4);
    expect(res.bestDay).toBeNull();
  });

  it("calculates rates and best day correctly", () => {
    const apps = [
      {
        id: "1",
        createdAt: "2026-03-03T09:00:00.000Z", // Tuesday Morning
        status: "INTERVIEW",
      },
      {
        id: "2",
        createdAt: "2026-03-03T10:00:00.000Z", // Tuesday Morning
        status: "OFFER",
      },
      {
        id: "3",
        createdAt: "2026-03-06T20:00:00.000Z", // Friday Evening
        status: "REJECTED",
      },
    ];

    const res = computeResponseTimingAnalytics(apps);
    expect(res.totalAnalyzed).toBe(3);
    const tuesday = res.dayStats.find((d) => d.dayName === "Dienstag");
    expect(tuesday?.totalApplications).toBe(2);
    expect(tuesday?.interviewRate).toBe(100);

    const friday = res.dayStats.find((d) => d.dayName === "Freitag");
    expect(friday?.totalApplications).toBe(1);
    expect(friday?.interviewRate).toBe(0);

    expect(res.bestDay).toBe("Dienstag");
  });
});
