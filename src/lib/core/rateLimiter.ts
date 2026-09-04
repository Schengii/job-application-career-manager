// -----------------------------------------------------------------------------
// Generischer In-Memory Rate-Limiter mit Lockout
// -----------------------------------------------------------------------------
// Zwei Einsatzzwecke teilen sich diese eine Fixed-Window-Implementierung:
//
//  1. `middleware.ts`: schützt den optionalen Passwortschutz (`APP_PASSWORD`,
//     siehe basicAuth.ts) vor automatisiertem Durchprobieren — der
//     konstante-Zeit-Vergleich in `timingSafeEqual` verhindert zwar
//     Timing-Angriffe, aber keine reine Brute-Force-Iteration über viele
//     Anfragen. Siehe `recordFailure`/`DEFAULT_AUTH_RATE_LIMIT`.
//  2. `src/lib/apiRateLimit.ts`: drosselt einzelne API-Routen mit externen
//     Kosten- oder Netzwerk-Auswirkungen (`/api/ai` ruft einen kostenpflichtigen
//     KI-Provider auf, `/api/jobs/scrape-url` fragt beliebige externe URLs ab,
//     `/api/jobs/live-search` externe Job-Portal-APIs) — ohne Begrenzung
//     könnte ein Client diese Routen beliebig oft aufrufen und so Kosten
//     verursachen oder die externen Dienste als Proxy missbrauchen. Siehe
//     `recordRequest`/`DEFAULT_API_RATE_LIMIT`.
//
// Bewusst in-memory (eine `Map` pro laufender Server-Instanz) statt in der
// SQLite-Datenbank:
//  - middleware.ts läuft vor jeder Route und potenziell in einer Umgebung
//    ohne Zugriff auf den `better-sqlite3`-Adapter (siehe Kommentar dort zu
//    Edge- vs. Node.js-Runtime).
//  - Laut README ist die App bewusst für Einzelnutzer-Betrieb gedacht. Ein
//    Neustart/Kaltstart der Server-Instanz setzt den Zähler zurück — für den
//    Bedrohungsfall "automatisierter Missbrauch in Echtzeit" ist das
//    akzeptabel, da es hier um Rate-Begrenzung geht, nicht um eine
//    dauerhafte Sperrliste.
//
// Fixed-Window-Zähler + Lockout: Nach `maxAttempts` Versuchen innerhalb von
// `windowMs` wird der Schlüssel (i. d. R. die Client-IP) für `lockoutMs`
// vollständig gesperrt — weitere Versuche werden ohne erneute Verarbeitung
// (Passwortvergleich bzw. teurer API-Aufruf) sofort abgelehnt.
// -----------------------------------------------------------------------------

interface Entry {
  count: number;
  windowStart: number;
  blockedUntil: number | null;
}

export type RateLimitStore = Map<string, Entry>;

export function createRateLimitStore(): RateLimitStore {
  return new Map<string, Entry>();
}

export interface RateLimitOptions {
  /** Anzahl Versuche (Login-Fehlversuche bzw. API-Aufrufe) innerhalb von `windowMs`, ab der gesperrt wird. */
  maxAttempts: number;
  /** Zeitfenster in ms, innerhalb dessen Versuche gezählt werden. */
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

/**
 * Default für kostenpflichtige/externe API-Routen (siehe apiRateLimit.ts):
 * 20 Anfragen pro 10 Minuten sind für normale interaktive Nutzung (auch mit
 * mehreren aufeinanderfolgenden Suchen/Anfragen) großzügig genug, begrenzen
 * aber ein Skript, das die Route in einer Schleife aufruft.
 */
export const DEFAULT_API_RATE_LIMIT: RateLimitOptions = {
  maxAttempts: 20,
  windowMs: 10 * 60 * 1000,
  lockoutMs: 10 * 60 * 1000,
  maxTrackedKeys: 2000,
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

/**
 * Zählt einen Versuch für `key` innerhalb des aktuellen Zeitfensters und
 * sperrt ihn, sobald `maxAttempts` erreicht ist. Gemeinsamer Kern von
 * `recordFailure` (Login-Fehlversuch) und `recordRequest` (API-Aufruf) —
 * beide unterscheiden sich nur in Benennung/Zweck, nicht im Verhalten.
 */
function recordAttempt(
  store: RateLimitStore,
  key: string,
  now: number,
  options: RateLimitOptions,
): RateLimitResult {
  let entry = store.get(key);

  if (!entry || now - entry.windowStart > options.windowMs) {
    entry = { count: 0, windowStart: now, blockedUntil: null };
  }

  entry.count += 1;
  if (entry.count >= options.maxAttempts) {
    entry.blockedUntil = now + options.lockoutMs;
  }

  evictOldestIfFull(store, key, options.maxTrackedKeys);
  store.set(key, entry);

  if (entry.blockedUntil !== null) {
    return { blocked: true, retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  return { blocked: false };
}

/** Zählt einen fehlgeschlagenen Login-Versuch für `key` (siehe middleware.ts). */
export function recordFailure(
  store: RateLimitStore,
  key: string,
  now: number,
  options: RateLimitOptions = DEFAULT_AUTH_RATE_LIMIT,
): RateLimitResult {
  return recordAttempt(store, key, now, options);
}

/** Zählt einen API-Aufruf für `key` (siehe apiRateLimit.ts) — jeder Aufruf zählt, unabhängig vom Ergebnis. */
export function recordRequest(
  store: RateLimitStore,
  key: string,
  now: number,
  options: RateLimitOptions = DEFAULT_API_RATE_LIMIT,
): RateLimitResult {
  return recordAttempt(store, key, now, options);
}

/** Setzt den Zähler für `key` nach einem erfolgreichen Login zurück. */
export function recordSuccess(store: RateLimitStore, key: string): void {
  store.delete(key);
}

/**
 * Ermittelt einen möglichst stabilen Schlüssel pro Client aus den Request-
 * Headern (i. d. R. die Client-IP) — gemeinsam genutzt von middleware.ts und
 * apiRateLimit.ts. Auf Vercel setzt der Edge-Proxy `x-forwarded-for`; der
 * erste Eintrag der Liste ist die tatsächliche Client-IP (weitere Einträge
 * stammen von Vercels eigener Proxy-Kette). Ohne den Header (z. B. lokal
 * ohne vorgeschalteten Proxy) greift ein fester Fallback-Key.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
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
