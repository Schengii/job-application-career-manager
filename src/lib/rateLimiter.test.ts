import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  createRateLimitStore,
  recordFailure,
  recordSuccess,
  type RateLimitOptions,
  type RateLimitStore,
} from "./rateLimiter";

const OPTIONS: RateLimitOptions = {
  maxAttempts: 3,
  windowMs: 10_000,
  lockoutMs: 5_000,
  maxTrackedKeys: 2,
};

describe("rateLimiter", () => {
  let store: RateLimitStore;

  beforeEach(() => {
    store = createRateLimitStore();
  });

  it("blockiert nicht, solange kein Versuch erfasst wurde", () => {
    expect(checkRateLimit(store, "1.2.3.4", 0)).toEqual({ blocked: false });
  });

  it("sperrt erst, nachdem maxAttempts Fehlversuche im Fenster erreicht sind", () => {
    let result;
    for (let i = 0; i < OPTIONS.maxAttempts - 1; i++) {
      result = recordFailure(store, "1.2.3.4", 1_000 + i, OPTIONS);
      expect(result.blocked).toBe(false);
    }
    result = recordFailure(store, "1.2.3.4", 1_500, OPTIONS);
    expect(result.blocked).toBe(true);
  });

  it("liefert einen sinnvollen Retry-After-Wert, solange die Sperre aktiv ist", () => {
    for (let i = 0; i < OPTIONS.maxAttempts; i++) {
      recordFailure(store, "1.2.3.4", 0, OPTIONS);
    }
    const check = checkRateLimit(store, "1.2.3.4", 2_000);
    expect(check).toEqual({ blocked: true, retryAfterSeconds: Math.ceil((OPTIONS.lockoutMs - 2_000) / 1000) });
  });

  it("hebt die Sperre nach Ablauf von lockoutMs automatisch wieder auf", () => {
    for (let i = 0; i < OPTIONS.maxAttempts; i++) {
      recordFailure(store, "1.2.3.4", 0, OPTIONS);
    }
    expect(checkRateLimit(store, "1.2.3.4", OPTIONS.lockoutMs + 1)).toEqual({ blocked: false });
  });

  it("setzt den Zähler nach einem erfolgreichen Login zurück", () => {
    recordFailure(store, "1.2.3.4", 0, OPTIONS);
    recordFailure(store, "1.2.3.4", 1, OPTIONS);
    recordSuccess(store, "1.2.3.4");

    // Danach sind wieder maxAttempts volle Fehlversuche nötig, bevor gesperrt wird.
    for (let i = 0; i < OPTIONS.maxAttempts - 1; i++) {
      expect(recordFailure(store, "1.2.3.4", 100 + i, OPTIONS).blocked).toBe(false);
    }
    expect(recordFailure(store, "1.2.3.4", 200, OPTIONS).blocked).toBe(true);
  });

  it("zählt Fehlversuche nach Ablauf des Zeitfensters wieder ab 0", () => {
    recordFailure(store, "1.2.3.4", 0, OPTIONS);
    recordFailure(store, "1.2.3.4", 1, OPTIONS);
    // Fenster ist abgelaufen -> alter Zähler zählt nicht mehr mit.
    const result = recordFailure(store, "1.2.3.4", OPTIONS.windowMs + 100, OPTIONS);
    expect(result.blocked).toBe(false);
  });

  it("verfolgt verschiedene Schlüssel (z. B. IPs) unabhängig voneinander", () => {
    for (let i = 0; i < OPTIONS.maxAttempts; i++) {
      recordFailure(store, "1.2.3.4", i, OPTIONS);
    }
    expect(checkRateLimit(store, "1.2.3.4", 0)).toEqual({ blocked: true, retryAfterSeconds: expect.any(Number) });
    expect(checkRateLimit(store, "5.6.7.8", 0)).toEqual({ blocked: false });
  });

  it("räumt bei Erreichen von maxTrackedKeys den ältesten Schlüssel, statt unbegrenzt zu wachsen", () => {
    recordFailure(store, "ip-a", 0, OPTIONS);
    recordFailure(store, "ip-b", 0, OPTIONS);
    expect(store.size).toBe(OPTIONS.maxTrackedKeys);

    // Ein dritter, neuer Schlüssel verdrängt den ältesten ("ip-a").
    recordFailure(store, "ip-c", 0, OPTIONS);
    expect(store.size).toBe(OPTIONS.maxTrackedKeys);
    expect(store.has("ip-a")).toBe(false);
    expect(store.has("ip-b")).toBe(true);
    expect(store.has("ip-c")).toBe(true);
  });

  it("verdrängt bei einem bereits bekannten Schlüssel keinen anderen Eintrag", () => {
    recordFailure(store, "ip-a", 0, OPTIONS);
    recordFailure(store, "ip-b", 0, OPTIONS);
    // "ip-a" ist bereits bekannt -> kein Verdrängen nötig, beide bleiben erhalten.
    recordFailure(store, "ip-a", 1, OPTIONS);
    expect(store.size).toBe(OPTIONS.maxTrackedKeys);
    expect(store.has("ip-a")).toBe(true);
    expect(store.has("ip-b")).toBe(true);
  });
});
