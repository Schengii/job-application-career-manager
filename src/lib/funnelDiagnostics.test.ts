import { describe, it, expect } from "vitest";
import { analyzeFunnelDiagnostics } from "./funnelDiagnostics";

describe("analyzeFunnelDiagnostics", () => {
  it("berechnet Kennzahlen und Benchmarks für eine erfolgreiche Pipeline", () => {
    const metrics = {
      total: 10,
      draft: 0,
      sent: 5,
      interview: 3,
      offer: 2,
      rejected: 0,
    };

    const result = analyzeFunnelDiagnostics(metrics);
    expect(result.sentToInterviewRate).toBe(50); // (3+2)/10 = 50%
    expect(result.interviewToOfferRate).toBe(40); // 2/5 = 40%
    expect(result.pipelineHealthScore).toBeGreaterThanOrEqual(80);
    expect(result.healthRating).toBe("TOP_TIER");
    expect(result.insights.some((i) => i.type === "POSITIVE")).toBe(true);
  });

  it("erkennt Engpässe bei niedriger Einladungsquote", () => {
    const metrics = {
      total: 15,
      draft: 0,
      sent: 14,
      interview: 1,
      offer: 0,
      rejected: 0,
    };

    const result = analyzeFunnelDiagnostics(metrics);
    expect(result.sentToInterviewRate).toBeLessThan(15);
    expect(result.insights.some((i) => i.id === "weak-resume")).toBe(true);
  });
});
