import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clientKeyFromHeaders,
  createRateLimitStore,
  recordFailure,
  recordRequest,
  recordSuccess,
  type RateLimitOptions,
  type RateLimitStore,
} from "@/lib/core/rateLimiter";

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

// recordRequest teilt sich die gesamte Fenster-/Lockout-Logik mit
// recordFailure (siehe recordAttempt in rateLimiter.ts) — hier wird nur
// geprüft, dass der eigenständige Einstiegspunkt für API-Routen (mit eigenem
// Zweck: "jeder Aufruf zählt", nicht "nur Fehlversuche") ebenfalls korrekt
// sperrt und wieder freigibt.
describe("recordRequest", () => {
  let store: RateLimitStore;

  beforeEach(() => {
    store = createRateLimitStore();
  });

  it("sperrt nach maxAttempts Aufrufen im Fenster", () => {
    for (let i = 0; i < OPTIONS.maxAttempts - 1; i++) {
      expect(recordRequest(store, "1.2.3.4", i, OPTIONS).blocked).toBe(false);
    }
    expect(recordRequest(store, "1.2.3.4", OPTIONS.maxAttempts, OPTIONS).blocked).toBe(true);
  });

  it("verwendet DEFAULT_API_RATE_LIMIT, wenn keine Optionen übergeben werden", () => {
    // 20 Aufrufe (Default maxAttempts) dürfen durchgehen, der 20. sperrt bereits.
    let result;
    for (let i = 0; i < 20; i++) {
      result = recordRequest(store, "1.2.3.4", i);
    }
    expect(result!.blocked).toBe(true);
  });
});

describe("clientKeyFromHeaders", () => {
  it("verwendet den ersten Eintrag von x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.5");
  });

  it("schneidet Leerzeichen um den ersten Eintrag ab", () => {
    const headers = new Headers({ "x-forwarded-for": "  203.0.113.5  , 70.41.3.18" });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.5");
  });

  it("fällt auf x-real-ip zurück, wenn x-forwarded-for fehlt", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(clientKeyFromHeaders(headers)).toBe("198.51.100.7");
  });

  it("liefert einen festen Fallback-Key, wenn beide Header fehlen", () => {
    expect(clientKeyFromHeaders(new Headers())).toBe("unknown");
  });
});
