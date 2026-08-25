import { describe, expect, it } from "vitest";
import { computeTagSuccessRates, computeTechStackSuccessRates, type ApplicationForSkillStats } from "./skillSuccessRates";

function app(overrides: Partial<ApplicationForSkillStats>): ApplicationForSkillStats {
  return {
    status: "SENT",
    tags: null,
    statusEvents: [],
    jobPosting: null,
    ...overrides,
  };
}

describe("computeTagSuccessRates", () => {
  it("berechnet Interview-/Angebotsquote je Tag", () => {
    const applications = [
      app({ tags: "Remote,Prio1", status: "OFFER" }),
      app({ tags: "Remote", status: "INTERVIEW" }),
      app({ tags: "Remote", status: "REJECTED" }),
      app({ tags: "Onsite", status: "REJECTED" }),
    ];

    const result = computeTagSuccessRates(applications);
    const remote = result.find((r) => r.skill === "Remote");

    expect(remote).toBeDefined();
    expect(remote!.total).toBe(3);
    expect(remote!.interviewCount).toBe(2); // OFFER zählt auch als "Interview erreicht"
    expect(remote!.interviewRate).toBe(67);
    expect(remote!.offerCount).toBe(1);
    expect(remote!.offerRate).toBe(33);
  });

  it("blendet Tags mit weniger als 2 Bewerbungen aus (Rauschunterdrückung)", () => {
    const applications = [app({ tags: "SeltenerTag", status: "OFFER" })];
    const result = computeTagSuccessRates(applications);
    expect(result.find((r) => r.skill === "SeltenerTag")).toBeUndefined();
  });

  it("zählt einen doppelt vergebenen Tag pro Bewerbung nur einmal", () => {
    const applications = [
      app({ tags: "Remote,Remote", status: "OFFER" }),
      app({ tags: "Remote", status: "SENT" }),
    ];
    const result = computeTagSuccessRates(applications);
    expect(result.find((r) => r.skill === "Remote")?.total).toBe(2);
  });

  it("berücksichtigt ein Interview aus der Status-Historie, auch wenn der aktuelle Status weiter ist", () => {
    const applications = [
      app({ tags: "Java", status: "REJECTED", statusEvents: [{ status: "INTERVIEW" }] }),
      app({ tags: "Java", status: "SENT" }),
    ];
    const result = computeTagSuccessRates(applications);
    expect(result.find((r) => r.skill === "Java")?.interviewCount).toBe(1);
  });

  it("sortiert absteigend nach Interview-Quote", () => {
    const applications = [
      app({ tags: "Niedrig", status: "SENT" }),
      app({ tags: "Niedrig", status: "REJECTED" }),
      app({ tags: "Hoch", status: "OFFER" }),
      app({ tags: "Hoch", status: "INTERVIEW" }),
    ];
    const result = computeTagSuccessRates(applications);
    expect(result[0].skill).toBe("Hoch");
  });

  it("gibt ein leeres Array zurück, wenn keine Bewerbungen vorhanden sind", () => {
    expect(computeTagSuccessRates([])).toEqual([]);
  });
});

describe("computeTechStackSuccessRates", () => {
  it("wertet den Tech-Stack der verknüpften Stellenanzeige aus, nicht die Application-Tags", () => {
    const applications = [
      app({ jobPosting: { techStack: "React,TypeScript" }, status: "OFFER" }),
      app({ jobPosting: { techStack: "React" }, status: "INTERVIEW" }),
      app({ tags: "React" /* sollte hier ignoriert werden */, jobPosting: null, status: "REJECTED" }),
    ];

    const result = computeTechStackSuccessRates(applications);
    const react = result.find((r) => r.skill === "React");
    expect(react?.total).toBe(2);
  });

  it("ignoriert Bewerbungen ohne verknüpfte Stellenanzeige", () => {
    const applications = [app({ jobPosting: null, status: "OFFER" })];
    expect(computeTechStackSuccessRates(applications)).toEqual([]);
  });
});
