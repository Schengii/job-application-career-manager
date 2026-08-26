import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createApiRateLimiter } from "./apiRateLimit";

function requestFrom(ip: string): NextRequest {
  return new NextRequest("http://localhost/api/example", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("createApiRateLimiter", () => {
  it("lässt Anfragen unterhalb des Limits durch (gibt null zurück)", () => {
    const rateLimit = createApiRateLimiter({ maxAttempts: 3, windowMs: 60_000, lockoutMs: 60_000, maxTrackedKeys: 100 });
    expect(rateLimit(requestFrom("1.2.3.4"))).toBeNull();
    expect(rateLimit(requestFrom("1.2.3.4"))).toBeNull();
  });

  it("liefert ab dem konfigurierten Limit eine 429-Response mit Retry-After-Header", () => {
    const rateLimit = createApiRateLimiter({ maxAttempts: 2, windowMs: 60_000, lockoutMs: 30_000, maxTrackedKeys: 100 });

    expect(rateLimit(requestFrom("1.2.3.4"))).toBeNull();
    const blocked = rateLimit(requestFrom("1.2.3.4"));

    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get("Retry-After")).toBe("30");
  });

  it("sperrt weitere Anfragen derselben IP, sobald einmal gesperrt wurde", () => {
    const rateLimit = createApiRateLimiter({ maxAttempts: 1, windowMs: 60_000, lockoutMs: 60_000, maxTrackedKeys: 100 });

    expect(rateLimit(requestFrom("1.2.3.4"))!.status).toBe(429);
    // Zweiter Aufruf trifft auf den bereits aktiven Lockout (checkRateLimit-Zweig).
    expect(rateLimit(requestFrom("1.2.3.4"))!.status).toBe(429);
  });

  it("behandelt verschiedene Client-IPs unabhängig voneinander", () => {
    // maxAttempts: 2, damit sich "IP ist bereits ausgeschöpft" (2 Aufrufe)
    // von "eine andere, noch unberührte IP ist frei" (0 Aufrufe) unterscheiden
    // lässt — bei maxAttempts: 1 würde JEDE neue IP schon beim allerersten
    // Aufruf sperren, unabhängig von einer etwaigen Isolation zwischen IPs.
    const rateLimit = createApiRateLimiter({ maxAttempts: 2, windowMs: 60_000, lockoutMs: 60_000, maxTrackedKeys: 100 });

    expect(rateLimit(requestFrom("1.2.3.4"))).toBeNull();
    expect(rateLimit(requestFrom("1.2.3.4"))!.status).toBe(429);
    expect(rateLimit(requestFrom("5.6.7.8"))).toBeNull();
  });

  it("hält für jede erzeugte Limiter-Instanz einen eigenen, isolierten Store", () => {
    const options = { maxAttempts: 2, windowMs: 60_000, lockoutMs: 60_000, maxTrackedKeys: 100 };
    const rateLimitA = createApiRateLimiter(options);
    const rateLimitB = createApiRateLimiter(options);

    rateLimitA(requestFrom("1.2.3.4"));
    expect(rateLimitA(requestFrom("1.2.3.4"))!.status).toBe(429);
    // Route B hat einen eigenen Store und dieselbe IP dort noch nie gesehen.
    expect(rateLimitB(requestFrom("1.2.3.4"))).toBeNull();
  });
});
