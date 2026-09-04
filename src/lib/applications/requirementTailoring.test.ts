import { describe, it, expect } from "vitest";
import { analyzeAndTailorRequirements } from "@/lib/applications/requirementTailoring";

describe("analyzeAndTailorRequirements", () => {
  it("erkennt passende Technologien aus der Stellenanzeige und erzeugt Belege aus Projekten", () => {
    const job = {
      title: "Frontend Developer (m/w/d)",
      description: "Wir suchen einen Entwickler mit Erfahrung in React, TypeScript und CSS3.",
      techStack: "React, TypeScript, CSS3, Docker",
    };

    const profile = {
      techStack: "TypeScript, JavaScript, React, CSS3, Next.js",
      desiredRole: "Fachinformatiker für Anwendungsentwicklung",
      projects: [
        {
          title: "electroCheck-ai",
          techStack: "React, TypeScript, Tailwind",
          description: "Mobile-first PWA mit REST-Anbindung",
        },
      ],
    };

    const result = analyzeAndTailorRequirements(job, profile);

    expect(result.overallMatchScore).toBeGreaterThan(50);
    expect(result.requirements.length).toBeGreaterThan(0);

    const reactReq = result.requirements.find((r) => r.requirement.toLowerCase() === "react");
    expect(reactReq?.status).toBe("MATCHED");
    expect(reactReq?.evidence).toContain("electroCheck-ai");

    const dockerReq = result.requirements.find((r) => r.requirement.toLowerCase() === "docker");
    expect(dockerReq?.status).toBe("GAP");
    expect(result.missingKeywordsToLearn).toContain("Docker");

    expect(result.tailoredOpeningPitch).toContain("Frontend Developer");
    expect(result.recommendedCoverLetterParagraph).toContain("electroCheck-ai");
  });
});
