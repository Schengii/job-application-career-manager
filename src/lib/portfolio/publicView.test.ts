import { describe, expect, it } from "vitest";
import { checkPortfolioAccess, toPublicPortfolio, type PortfolioAccessInput } from "@/lib/portfolio/publicView";

const base: PortfolioAccessInput = {
  portfolioShareToken: "tok123",
  portfolioActive: true,
  portfolioTokenExpiresAt: new Date("2030-01-01"),
  portfolioPin: null,
};
const now = new Date("2026-01-01");

describe("checkPortfolioAccess", () => {
  it("erlaubt gültigen Token ohne PIN", () => {
    expect(checkPortfolioAccess(base, "tok123", undefined, now)).toBe("ok");
  });

  it("lehnt falschen Token, deaktiviertes Portfolio und fehlende Preferences ab", () => {
    expect(checkPortfolioAccess(base, "nope", undefined, now)).toBe("invalid");
    expect(checkPortfolioAccess({ ...base, portfolioActive: false }, "tok123", undefined, now)).toBe("invalid");
    expect(checkPortfolioAccess(null, "tok123", undefined, now)).toBe("invalid");
  });

  it("lehnt abgelaufene Token ab", () => {
    const expired = { ...base, portfolioTokenExpiresAt: new Date("2025-01-01") };
    expect(checkPortfolioAccess(expired, "tok123", undefined, now)).toBe("invalid");
  });

  it("verlangt und prüft die PIN serverseitig", () => {
    const withPin = { ...base, portfolioPin: "1234" };
    expect(checkPortfolioAccess(withPin, "tok123", undefined, now)).toBe("pin_required");
    expect(checkPortfolioAccess(withPin, "tok123", "0000", now)).toBe("pin_wrong");
    expect(checkPortfolioAccess(withPin, "tok123", "1234", now)).toBe("ok");
  });
});

describe("toPublicPortfolio", () => {
  it("gibt keine internen Felder weiter", () => {
    const source = {
      fullName: "A",
      email: "a@b.de",
      projectEntries: [],
      educationEntries: [],
      portfolioPin: "1234",
      aiApiKey: "secret",
      minSalary: 50000,
    };
    expect(JSON.stringify(toPublicPortfolio(source))).not.toMatch(/1234|secret|minSalary/);
  });
});
