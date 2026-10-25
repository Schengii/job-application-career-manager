import { describe, expect, it } from "vitest";
import { isBasicAuthValid, isPublicPath, isUnprotectedDeployment, timingSafeEqual } from "@/lib/core/basicAuth";

function basicAuthHeader(user: string, password: string): string {
  return `Basic ${btoa(`${user}:${password}`)}`;
}

describe("timingSafeEqual", () => {
  it("liefert true für identische Strings", () => {
    expect(timingSafeEqual("geheim", "geheim")).toBe(true);
  });

  it("liefert false für unterschiedliche Strings gleicher Länge", () => {
    expect(timingSafeEqual("geheim1", "geheim2")).toBe(false);
  });

  it("liefert false für unterschiedliche Längen", () => {
    expect(timingSafeEqual("kurz", "langespasswort")).toBe(false);
  });
});

describe("isBasicAuthValid", () => {
  const APP_PASSWORD = "korrektes-passwort-123";

  it("akzeptiert einen gültigen Basic-Auth-Header unabhängig vom Benutzernamen", () => {
    expect(isBasicAuthValid(basicAuthHeader("irgendwer", APP_PASSWORD), APP_PASSWORD)).toBe(true);
    expect(isBasicAuthValid(basicAuthHeader("admin", APP_PASSWORD), APP_PASSWORD)).toBe(true);
  });

  it("lehnt ein falsches Passwort ab", () => {
    expect(isBasicAuthValid(basicAuthHeader("admin", "falsch"), APP_PASSWORD)).toBe(false);
  });

  it("lehnt einen fehlenden Header ab", () => {
    expect(isBasicAuthValid(null, APP_PASSWORD)).toBe(false);
    expect(isBasicAuthValid(undefined, APP_PASSWORD)).toBe(false);
  });

  it("lehnt einen Header ohne 'Basic '-Präfix ab", () => {
    expect(isBasicAuthValid(`Bearer ${btoa(`admin:${APP_PASSWORD}`)}`, APP_PASSWORD)).toBe(false);
  });

  it("lehnt ungültiges Base64 ab, statt zu werfen", () => {
    expect(isBasicAuthValid("Basic ###nicht-valide-base64###", APP_PASSWORD)).toBe(false);
  });

  it("lehnt einen Header ohne ':' -Trenner ab", () => {
    expect(isBasicAuthValid(`Basic ${btoa("keinTrennzeichen")}`, APP_PASSWORD)).toBe(false);
  });
});

describe("isPublicPath", () => {
  it("erlaubt Cron-Tick, Portfolio-Tracking und Recruiter-Ansicht", () => {
    expect(isPublicPath("/api/cron/tick")).toBe(true);
    expect(isPublicPath("/api/portfolio/track")).toBe(true);
    expect(isPublicPath("/portfolio/abc123")).toBe(true);
  });

  it("schützt alle übrigen Pfade", () => {
    expect(isPublicPath("/api/applications")).toBe(false);
    expect(isPublicPath("/api/portfolio/token")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
  });
});

describe("isUnprotectedDeployment", () => {
  it("sperrt Vercel ohne APP_PASSWORD", () => {
    expect(isUnprotectedDeployment({ VERCEL: "1" })).toBe(true);
  });

  it("lässt Vercel mit Passwort und lokalen Betrieb zu", () => {
    expect(isUnprotectedDeployment({ VERCEL: "1", APP_PASSWORD: "x" })).toBe(false);
    expect(isUnprotectedDeployment({})).toBe(false);
  });
});
