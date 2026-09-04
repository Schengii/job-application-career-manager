import { describe, it, expect } from "vitest";
import { checkColumnWip, detectGhosting } from "@/lib/applications/kanbanWip";
import type { ApplicationListItem } from "@/types";

describe("kanbanWip", () => {
  it("erkennt Spaltenüberlastung bei Überschreitung des WIP-Limits", () => {
    const normal = checkColumnWip("INTERVIEW", 3);
    expect(normal.isOverloaded).toBe(false);
    expect(normal.label).toBe("3/5");

    const overloaded = checkColumnWip("INTERVIEW", 7);
    expect(overloaded.isOverloaded).toBe(true);
    expect(overloaded.label).toBe("7/5");

    const unlimited = checkColumnWip("OFFER", 10);
    expect(unlimited.limit).toBeNull();
    expect(unlimited.isOverloaded).toBe(false);
    expect(unlimited.label).toBe("10");
  });

  it("erkennt Ghosting bei Bewerbungen im Status SENT nach 30+ Tagen", () => {
    const reference = new Date("2026-09-01T12:00:00Z");

    const recentApp = {
      id: "app-recent",
      status: "SENT",
      applicationDate: "2026-08-20T10:00:00Z", // ~12 Tage alt
    } as unknown as ApplicationListItem;

    const recentStatus = detectGhosting(recentApp, 30, reference);
    expect(recentStatus.isGhosting).toBe(false);

    const oldApp = {
      id: "app-old",
      status: "SENT",
      applicationDate: "2026-07-01T10:00:00Z", // ~62 Tage alt
    } as unknown as ApplicationListItem;

    const oldStatus = detectGhosting(oldApp, 30, reference);
    expect(oldStatus.isGhosting).toBe(true);
    expect(oldStatus.daysSinceApplication).toBeGreaterThanOrEqual(60);
    expect(oldStatus.label).toContain("Keine Rückmeldung");
  });

  it("erkennt kein Ghosting bei anderen Status", () => {
    const rejectedApp = {
      id: "app-rej",
      status: "REJECTED",
      applicationDate: "2026-01-01T10:00:00Z",
    } as unknown as ApplicationListItem;

    const status = detectGhosting(rejectedApp);
    expect(status.isGhosting).toBe(false);
  });
});
