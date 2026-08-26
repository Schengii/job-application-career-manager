// -----------------------------------------------------------------------------
// Generischer In-Memory Rate-Limiter mit Lockout für middleware.ts
// -----------------------------------------------------------------------------
// Schützt den optionalen Passwortschutz (`APP_PASSWORD`, siehe basicAuth.ts)
// vor automatisiertem Durchprobieren: Ohne Begrenzung könnte jeder, der die
// gehostete URL kennt, das Passwort beliebig oft per Skript testen — der
// konstante-Zeit-Vergleich in `timingSafeEqual` verhindert zwar Timing-Angriffe,
// aber keine reine Brute-Force-Iteration über viele Anfragen.
//
// Bewusst in-memory (eine `Map` pro laufender Server-Instanz) statt in der
// SQLite-Datenbank:
//  - middleware.ts läuft vor jeder Route und potenziell in einer Umgebung
//    ohne Zugriff auf den `better-sqlite3`-Adapter (siehe Kommentar dort zu
//    Edge- vs. Node.js-Runtime).
//  - Laut README ist die App bewusst für Einzelnutzer-Betrieb gedacht. Ein
//    Neustart/Kaltstart der Server-Instanz setzt den Zähler zurück — für den
//    Bedrohungsfall "Online-Brute-Force in Echtzeit" ist das akzeptabel, da
//    es hier um Rate-Begrenzung geht, nicht um eine dauerhafte Sperrliste.
//
// Fixed-Window-Zähler + Lockout: Nach `maxAttempts` fehlgeschlagenen
// Versuchen innerhalb von `windowMs` wird der Schlüssel (i. d. R. die
// Client-IP) für `lockoutMs` vollständig gesperrt — weitere Versuche werden
// ohne erneuten Passwort-Vergleich sofort abgelehnt.
// -----------------------------------------------------------------------------

interface Entry {
  failures: number;
  windowStart: number;
  blockedUntil: number | null;
}

export type RateLimitStore = Map<string, Entry>;

export function createRateLimitStore(): RateLimitStore {
  return new Map<string, Entry>();
}

export interface RateLimitOptions {
  /** Anzahl fehlgeschlagener Versuche innerhalb von `windowMs`, ab der gesperrt wird. */
  maxAttempts: number;
  /** Zeitfenster in ms, innerhalb dessen Fehlversuche gezählt werden. */
  windowMs: number;
  /** Sperrdauer in ms, sobald `maxAttempts` erreicht ist. */
  lockoutMs: number;
  /** Obergrenze gleichzeitig verfolgter Schlüssel, gegen unbegrenztes Speicherwachstum durch viele (ggf. gefälschte) IPs. */
  maxTrackedKeys: number;
}

export const DEFAULT_AUTH_RATE_LIMIT: RateLimitOptions = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
  maxTrackedKeys: 5000,
};

export type RateLimitResult = { blocked: false } | { blocked: true; retryAfterSeconds: number };

/** Prüft, ob `key` aktuell gesperrt ist, ohne selbst einen Versuch zu zählen. */
export function checkRateLimit(store: RateLimitStore, key: string, now: number): RateLimitResult {
  const entry = store.get(key);
  if (!entry || entry.blockedUntil === null) return { blocked: false };

  if (now < entry.blockedUntil) {
    return { blocked: true, retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
  }

  // Sperre abgelaufen -> Eintrag verwerfen, nächster Fehlversuch startet bei 0.
  store.delete(key);
  return { blocked: false };
}

/** Zählt einen fehlgeschlagenen Versuch für `key` und sperrt ihn, sobald `maxAttempts` erreicht ist. */
export function recordFailure(
  store: RateLimitStore,
  key: string,
  now: number,
  options: RateLimitOptions = DEFAULT_AUTH_RATE_LIMIT,
): RateLimitResult {
  let entry = store.get(key);

  if (!entry || now - entry.windowStart > options.windowMs) {
    entry = { failures: 0, windowStart: now, blockedUntil: null };
  }

  entry.failures += 1;
  if (entry.failures >= options.maxAttempts) {
    entry.blockedUntil = now + options.lockoutMs;
  }

  evictOldestIfFull(store, key, options.maxTrackedKeys);
  store.set(key, entry);

  if (entry.blockedUntil !== null) {
    return { blocked: true, retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  return { blocked: false };
}

/** Setzt den Zähler für `key` nach einem erfolgreichen Login zurück. */
export function recordSuccess(store: RateLimitStore, key: string): void {
  store.delete(key);
}

/**
 * Räumt bei Bedarf den ältesten verfolgten Schlüssel, bevor ein neuer, bisher
 * unbekannter Schlüssel den Store über `maxTrackedKeys` wachsen lassen würde.
 * Einfache FIFO-Räumung (Map behält Einfügereihenfolge) reicht für diesen
 * Anwendungsfall — es geht nur darum, unbegrenztes Wachstum zu verhindern,
 * nicht um exakte LRU-Semantik.
 */
function evictOldestIfFull(store: RateLimitStore, incomingKey: string, maxTrackedKeys: number): void {
  if (store.has(incomingKey) || store.size < maxTrackedKeys) return;
  const oldestKey = store.keys().next().value;
  if (oldestKey !== undefined) store.delete(oldestKey);
}
