import { describe, it, expect } from "vitest";
import { calculateGoalStats } from "./goalTracker";
import type { ApplicationListItem } from "@/types";

describe("goalTracker engine", () => {
  it("calculates weekly progress correctly", () => {
    // Reference date: Wednesday 2026-08-26
    const refDate = new Date("2026-08-26T12:00:00Z");

    const mockApps = [
      {
        id: "1",
        position: "Frontend Dev",
        status: "SENT",
        applicationDate: new Date("2026-08-25T10:00:00Z"),
        createdAt: new Date("2026-08-25T10:00:00Z"),
        updatedAt: new Date("2026-08-25T10:00:00Z"),
        company: { name: "A" },
      },
      {
        id: "2",
        position: "React Dev",
        status: "SENT",
        applicationDate: new Date("2026-08-24T10:00:00Z"),
        createdAt: new Date("2026-08-24T10:00:00Z"),
        updatedAt: new Date("2026-08-24T10:00:00Z"),
        company: { name: "B" },
      },
      {
        id: "3",
        position: "Fullstack Dev",
        status: "INTERVIEW",
        applicationDate: new Date("2026-08-10T10:00:00Z"), // older week
        createdAt: new Date("2026-08-10T10:00:00Z"),
        updatedAt: new Date("2026-08-10T10:00:00Z"),
        company: { name: "C" },
      },
    ] as unknown as ApplicationListItem[];

    const stats = calculateGoalStats(mockApps, 4, refDate);

    expect(stats.weeklyGoal).toBe(4);
    expect(stats.currentWeekCount).toBe(2);
    expect(stats.weeklyProgressPct).toBe(50);
    expect(stats.isGoalReached).toBe(false);
    expect(stats.totalApplications).toBe(3);
    expect(stats.interviewsCount).toBe(1);

    // Milestones check
    const firstAppMilestone = stats.milestones.find((m) => m.id === "first_app");
    const interviewMilestone = stats.milestones.find((m) => m.id === "first_interview");
    expect(firstAppMilestone?.achieved).toBe(true);
    expect(interviewMilestone?.achieved).toBe(true);
  });

  it("handles reaching the weekly goal", () => {
    const refDate = new Date("2026-08-26T12:00:00Z");
    const mockApps = Array.from({ length: 5 }, (_, i) => ({
      id: `app-${i}`,
      position: `Dev ${i}`,
      status: "SENT",
      applicationDate: new Date("2026-08-24T10:00:00Z"),
      createdAt: new Date("2026-08-24T10:00:00Z"),
      updatedAt: new Date("2026-08-24T10:00:00Z"),
      company: { name: `Company ${i}` },
    })) as unknown as ApplicationListItem[];

    const stats = calculateGoalStats(mockApps, 5, refDate);
    expect(stats.currentWeekCount).toBe(5);
    expect(stats.weeklyProgressPct).toBe(100);
    expect(stats.isGoalReached).toBe(true);
    const weeklyGoalMilestone = stats.milestones.find((m) => m.id === "weekly_goal");
    expect(weeklyGoalMilestone?.achieved).toBe(true);
  });
});
