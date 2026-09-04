import { describe, expect, it } from "vitest";
import { calculateSalaryBenchmark } from "@/lib/salary/salaryBenchmark";

describe("salaryBenchmark", () => {
  it("berechnet das Gehalts-Benchmarking für Berufseinsteiger in Bonn/Köln", () => {
    const benchmark = calculateSalaryBenchmark("JUNIOR_ENTRY", "NRW_BONN_KOELN", 48000);

    expect(benchmark.median).toBeGreaterThan(42000);
    expect(benchmark.p25).toBeLessThan(benchmark.median);
    expect(benchmark.p75).toBeGreaterThan(benchmark.median);
    expect(benchmark.p90).toBeGreaterThan(benchmark.p75);
    expect(benchmark.userTargetSalary).toBe(48000);
    expect(typeof benchmark.userTargetVsMedianPercent).toBe("number");
    expect(benchmark.negotiationTips.length).toBeGreaterThan(0);
  });

  it("berücksichtigt regionale Multiplikatoren (z.B. München höher als Ruhrgebiet)", () => {
    const muenchen = calculateSalaryBenchmark("MID_LEVEL", "MUENCHEN");
    const ruhrgebiet = calculateSalaryBenchmark("MID_LEVEL", "NRW_RUHRGEBIET");

    expect(muenchen.median).toBeGreaterThan(ruhrgebiet.median);
  });
});
