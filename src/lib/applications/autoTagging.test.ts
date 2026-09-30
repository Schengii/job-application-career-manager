import { describe, it, expect } from "vitest";
import { generateSuggestedTags } from "./autoTagging";

describe("generateSuggestedTags", () => {
  it("detects remote, react, and location tags properly", () => {
    const tags = generateSuggestedTags({
      position: "Frontend Entwickler (React/TypeScript)",
      techStack: "React 19, TypeScript, Next.js, Tailwind",
      location: "Köln",
      remote: true,
    });

    expect(tags).toContain("Remote");
    expect(tags).toContain("React19");
    expect(tags).toContain("TypeScript");
    expect(tags).toContain("Next.js");
    expect(tags).toContain("Köln");
  });

  it("identifies junior and startup environments", () => {
    const tags = generateSuggestedTags({
      position: "Junior Web Developer in innovativem Startup",
      techStack: "JavaScript, CSS, HTML",
      location: "Bonn",
    });

    expect(tags).toContain("Junior");
    expect(tags).toContain("Startup");
    expect(tags).toContain("Bonn");
  });
});
