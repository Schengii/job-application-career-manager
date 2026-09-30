import { describe, it, expect } from "vitest";
import {
  validateStarStory,
  formatStarStoryForTeleprompter,
  STAR_PRESETS,
} from "./starStoryBuilder";

describe("starStoryBuilder", () => {
  it("validates empty story as invalid with score 0", () => {
    const res = validateStarStory({});
    expect(res.valid).toBe(false);
    expect(res.score).toBe(0);
    expect(res.feedback.situation).toContain("Bitte beschreibe");
  });

  it("evaluates a complete preset story with a high score", () => {
    const preset = STAR_PRESETS[0];
    const res = validateStarStory(preset);
    expect(res.valid).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(90);
    expect(res.feedback.result).toContain("Hervorragend");
  });

  it("formats story cleanly for teleprompter", () => {
    const text = formatStarStoryForTeleprompter({
      id: "s-1",
      title: "Test Story",
      category: "OPTIMIZATION",
      situation: "Sit text",
      task: "Task text",
      action: "Ich habe X gemacht",
      result: "10% schneller",
      keyTakeaway: "Immer testen",
      techTags: ["React"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(text).toContain("STORY: TEST STORY");
    expect(text).toContain("[S] KONTEXT:\nSit text");
    expect(text).toContain("[A] MEINE AKTION:\nIch habe X gemacht");
    expect(text).toContain("[TAKEAWAY] FAZIT:\nImmer testen");
    expect(text).toContain("Tech-Tags: React");
  });
});
