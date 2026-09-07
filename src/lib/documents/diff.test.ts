import { describe, it, expect } from "vitest";
import { computeTextDiff } from "./diff";

describe("diff utility", () => {
  it("erkennt unveränderten Text", () => {
    const text = "Zeile 1\nZeile 2\nZeile 3";
    const res = computeTextDiff(text, text);

    expect(res.addedCount).toBe(0);
    expect(res.removedCount).toBe(0);
    expect(res.unchangedCount).toBe(3);
    expect(res.lines.every((l) => l.type === "UNCHANGED")).toBe(true);
  });

  it("erkennt Hinzufügungen und Streichungen", () => {
    const oldText = "Zeile 1\nAlte Zeile\nZeile 3";
    const newText = "Zeile 1\nNeue Zeile\nZeile 3\nBonus Zeile";

    const res = computeTextDiff(oldText, newText);

    expect(res.removedCount).toBe(1);
    expect(res.addedCount).toBe(2);
    expect(res.unchangedCount).toBe(2);
  });
});
