import { describe, expect, it } from "vitest";
import { estimateCommute } from "./commuteCalculator";

describe("commuteCalculator", () => {
  it("berechnet Pendelzeiten für Bonn und Köln", () => {
    const bonn = estimateCommute("Bonn Zentrum", false, 2);
    expect(bonn.transitMinutes).toBe(15);
    expect(bonn.isRemote).toBe(false);

    const koeln = estimateCommute("Köln Hbf", false, 2);
    expect(koeln.transitMinutes).toBe(28);
    expect(koeln.monthlyTransitCost).toBe(58);
    expect(koeln.annualHomeOfficeSavingsHours).toBeGreaterThan(30);
  });

  it("behandelt Remote-Jobs ohne Pendelzeit und mit maximaler Zeitersparnis", () => {
    const remote = estimateCommute("Deutschlandweit (100% Remote)", true, 5);
    expect(remote.isRemote).toBe(true);
    expect(remote.transitMinutes).toBe(0);
    expect(remote.annualHomeOfficeSavingsHours).toBeGreaterThan(200);
  });
});
