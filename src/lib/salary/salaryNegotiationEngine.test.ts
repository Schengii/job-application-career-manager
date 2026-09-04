import { describe, it, expect } from "vitest";
import {
  SCENARIOS,
  generateNegotiationStep,
  evaluateNegotiationPerformance,
  NegotiationMessage,
} from "@/lib/salary/salaryNegotiationEngine";

describe("salaryNegotiationEngine", () => {
  it("erkennt Value Framing und erhöht das Gegenangebot der KI", () => {
    const scenario = SCENARIOS[0]; // Initial 43.000 €, Target 48.000 €
    const history: NegotiationMessage[] = [
      {
        id: "msg-1",
        sender: "AI",
        text: scenario.initialMessage,
        timestamp: new Date().toISOString(),
        currentOfferAmount: 43000,
      },
    ];

    const userText =
      "Vielen Dank für das Angebot! Da ich durch meine Projekte wie electroCheck-ai fundierte Kenntnisse in React, TypeScript und Next.js mitbringe und sofort produktiv bin, hatte ich mir 48.000 € vorgestellt.";

    const result = generateNegotiationStep(scenario, history, userText);

    expect(result.newOffer).toBeGreaterThan(43000);
    expect(result.reply).toContain("€");
    expect(result.tacticalTip.length).toBeGreaterThan(10);
  });

  it("bewertet eine erfolgreiche Verhandlung mit einer detaillierten Scorecard", () => {
    const scenario = SCENARIOS[0];
    const history: NegotiationMessage[] = [
      {
        id: "msg-1",
        sender: "AI",
        text: scenario.initialMessage,
        timestamp: new Date().toISOString(),
        currentOfferAmount: 43000,
      },
      {
        id: "msg-2",
        sender: "USER",
        text: "Ich bringe starke Praxis in TypeScript und React mit und habe 48.000 € angepeilt.",
        timestamp: new Date().toISOString(),
      },
      {
        id: "msg-3",
        sender: "AI",
        text: "Wir können auf 45.500 € gehen.",
        timestamp: new Date().toISOString(),
        currentOfferAmount: 45500,
      },
      {
        id: "msg-4",
        sender: "USER",
        text: "Können wir uns auf 47.000 € plus 3 Tage Home-Office und ein Weiterbildungsbudget einigen?",
        timestamp: new Date().toISOString(),
      },
      {
        id: "msg-5",
        sender: "AI",
        text: "Einverstanden!",
        timestamp: new Date().toISOString(),
        currentOfferAmount: 47000,
      },
    ];

    const evaluation = evaluateNegotiationPerformance(scenario, history);

    expect(evaluation.overallScore).toBeGreaterThanOrEqual(70);
    expect(evaluation.finalOffer).toBe(47000);
    expect(evaluation.deltaToTarget).toBe(4000);
    expect(evaluation.tacticsUsed.valueFraming).toBe(true);
    expect(evaluation.tacticsUsed.nonMonetaryCompromise).toBe(true);
  });
});
