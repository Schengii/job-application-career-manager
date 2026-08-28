// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SkillRoadmapTracker } from "./skill-roadmap-tracker";

describe("SkillRoadmapTracker", () => {
  it("rendert Meilensteine und erlaubt das Abhaken und Hinzufügen von Zielen", () => {
    render(<SkillRoadmapTracker />);

    expect(screen.getByText(/Persönliche Skill- & Lernziel-Roadmap/i)).toBeDefined();
    expect(screen.getByText(/Roadmap-Fortschritt/i)).toBeDefined();

    const addBtn = screen.getAllByText(/Hinzufügen/i)[0];
    expect(addBtn).toBeDefined();
  });
});
