import { describe, expect, it } from "vitest";
import { computeMatchScore } from "./matching";

const preferences = {
  techStack: "TypeScript,JavaScript,CSS,React,Next.js,HTML",
  preferredLocations: "Bonn,Dortmund,Remote",
  remotePreference: "HYBRID",
  desiredRole: "Fachinformatiker für Anwendungsentwicklung",
};

describe("computeMatchScore", () => {
  it("gibt einen hohen Score für eine nahezu perfekte Übereinstimmung", () => {
    const score = computeMatchScore({
      job: {
        title: "Fachinformatiker Anwendungsentwicklung (m/w/d) - Frontend",
        description: "TypeScript, JavaScript, React, Next.js, HTML und CSS im agilen Team.",
        location: "Bonn",
        remote: false,
        requirementsProfile: "Gute Kenntnisse in TypeScript und React.",
        techStack: "TypeScript,JavaScript,React,Next.js,HTML,CSS",
      },
      preferences,
    });
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("findet Rollen-Keywords auch ohne Füllwörter wie 'für' im Stellentitel (Regression)", () => {
    // Der Stellentitel enthält "Anwendungsentwicklung" aber nicht "für" –
    // die alte Implementierung suchte die gesamte Phrase als einen String
    // und scheiterte daran.
    const score = computeMatchScore({
      job: {
        title: "Fachinformatiker Anwendungsentwicklung (m/w/d)",
        description: "",
        location: "Dortmund",
        remote: false,
        requirementsProfile: null,
        techStack: "TypeScript,JavaScript,CSS",
      },
      preferences,
    });
    const scoreWithoutRoleMatch = computeMatchScore({
      job: {
        title: "Etwas ganz anderes (m/w/d)",
        description: "",
        location: "Dortmund",
        remote: false,
        requirementsProfile: null,
        techStack: "TypeScript,JavaScript,CSS",
      },
      preferences,
    });
    expect(score).toBeGreaterThan(scoreWithoutRoleMatch);
  });

  it("gibt einen niedrigen Score bei komplett unpassendem Job", () => {
    const score = computeMatchScore({
      job: {
        title: "Koch (m/w/d)",
        description: "Wir suchen einen Koch für unser Restaurant.",
        location: "München",
        remote: false,
        requirementsProfile: null,
        techStack: null,
      },
      preferences,
    });
    expect(score).toBeLessThan(20);
  });

  it("bewertet Remote-Jobs positiv bei Remote-freundlicher Präferenz", () => {
    const score = computeMatchScore({
      job: {
        title: "Frontend Developer",
        description: "TypeScript, React, CSS",
        location: "Irgendwo",
        remote: true,
        requirementsProfile: null,
        techStack: "TypeScript,React,CSS",
      },
      preferences,
    });
    const scoreOnsiteElsewhere = computeMatchScore({
      job: {
        title: "Frontend Developer",
        description: "TypeScript, React, CSS",
        location: "Irgendwo",
        remote: false,
        requirementsProfile: null,
        techStack: "TypeScript,React,CSS",
      },
      preferences,
    });
    expect(score).toBeGreaterThan(scoreOnsiteElsewhere);
  });

  it("bleibt immer im Bereich 0-100", () => {
    const score = computeMatchScore({
      job: {
        title: "Fachinformatiker für Anwendungsentwicklung Frontend TypeScript React CSS",
        description: "TypeScript React CSS JavaScript Next.js HTML",
        location: "Bonn",
        remote: true,
        requirementsProfile: "TypeScript React CSS JavaScript Next.js HTML",
        techStack: "TypeScript,JavaScript,CSS,React,Next.js,HTML",
      },
      preferences,
    });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("berücksichtigt benutzerdefinierte Gewichtungen (Tech vs. Location)", () => {
    const job = {
      title: "Frontend Developer",
      description: "TypeScript und React",
      location: "München",
      remote: false,
      requirementsProfile: null,
      techStack: "TypeScript,React",
    };

    // Hohe Tech-Gewichtung (80%) vs. niedrige Tech-Gewichtung (20%)
    const highTech = computeMatchScore({
      job,
      preferences,
      weights: { techWeight: 0.8, locationWeight: 0.1, roleWeight: 0.1, bonusWeight: 0 },
    });

    const lowTech = computeMatchScore({
      job,
      preferences,
      weights: { techWeight: 0.2, locationWeight: 0.7, roleWeight: 0.1, bonusWeight: 0 },
    });

    expect(highTech).toBeGreaterThan(lowTech);
  });
});
