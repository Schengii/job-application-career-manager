import { describe, expect, it } from "vitest";
import {
  createDefaultRound,
  STAGE_CONFIGS,
  parseRoundsFromInteractionSummary,
  serializeRoundsToInteractionSummary,
  InterviewRoundData,
} from "./multiRoundInterviewManager";

describe("multiRoundInterviewManager", () => {
  it("erzeugt korrekte Standard-Runde für TECH_INTERVIEW", () => {
    const round = createDefaultRound("TECH_INTERVIEW", 3);
    expect(round.roundNumber).toBe(3);
    expect(round.stage).toBe("TECH_INTERVIEW");
    expect(round.durationMinutes).toBe(60);
    expect(round.status).toBe("SCHEDULED");
    expect(round.keyQuestionsToAsk).toHaveLength(STAGE_CONFIGS.TECH_INTERVIEW.suggestedQuestionsToAsk.length);
  });

  it("serialisiert und deserialisiert Runden verlustfrei", () => {
    const rounds: InterviewRoundData[] = [
      createDefaultRound("SCREENING", 1),
      {
        ...createDefaultRound("CODING_CHALLENGE", 2),
        status: "PASSED",
        interviewerNames: "Lukas Becker",
        feedbackNotes: "Sehr gut gelöst, RSC-Konzepte verstanden",
      },
    ];

    const json = serializeRoundsToInteractionSummary(rounds);
    expect(typeof json).toBe("string");

    const restored = parseRoundsFromInteractionSummary(json);
    expect(restored).toHaveLength(2);
    expect(restored[1].status).toBe("PASSED");
    expect(restored[1].interviewerNames).toBe("Lukas Becker");
  });

  it("gibt leeres Array bei ungültigem JSON zurück", () => {
    expect(parseRoundsFromInteractionSummary(null)).toEqual([]);
    expect(parseRoundsFromInteractionSummary("ungueltiger text")).toEqual([]);
    expect(parseRoundsFromInteractionSummary("{}")).toEqual([]);
  });
});
