import { describe, expect, it } from "vitest";
import {
  IT_CONTRACT_CLAUSES,
  evaluateContractClauses,
  ContractClauseCheckItem,
} from "./contractClauseAudit";

describe("contractClauseAudit", () => {
  it("enthält essenzielle IT-Klauseln (Überstunden, Home-Office, IP, Weiterbildung)", () => {
    expect(IT_CONTRACT_CLAUSES.length).toBeGreaterThanOrEqual(5);

    const ids = IT_CONTRACT_CLAUSES.map((c) => c.id);
    expect(ids).toContain("overtime_blanket");
    expect(ids).toContain("remote_work_entitlement");
    expect(ids).toContain("ip_open_source");
    expect(ids).toContain("education_budget");
  });

  it("berechnet den Contract Safety Score akkurat", () => {
    const sample: ContractClauseCheckItem[] = IT_CONTRACT_CLAUSES.map((c, idx) => ({
      ...c,
      status: idx < 3 ? "PASSED" : "FAILED",
    }));

    const result = evaluateContractClauses(sample);
    expect(result.passedCount).toBe(3);
    expect(result.failedCount).toBe(sample.length - 3);
    expect(result.safetyScore).toBe(50);
  });
});
