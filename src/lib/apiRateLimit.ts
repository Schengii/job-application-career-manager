// -----------------------------------------------------------------------------
// Rate-Limiting für einzelne API-Routen mit externen Kosten-/Netzwerk-Effekten
// -----------------------------------------------------------------------------
// `middleware.ts` begrenzt bereits Login-Versuche gegen `APP_PASSWORD` — das
// schützt aber nicht davor, dass ein bereits authentifizierter (oder bei
// deaktiviertem Passwortschutz: jeder) Client einzelne teure Routen beliebig
// oft aufruft: `/api/ai` ruft einen kostenpflichtigen KI-Provider auf,
// `/api/jobs/scrape-url` fragt beliebige externe URLs ab, `/api/jobs/live-search`
// externe Job-Portal-APIs (Bundesagentur für Arbeit, Arbeitnow). Dieser
// Wrapper gibt jeder Route ihren eigenen, isolierten Rate-Limit-Store (siehe
// `src/lib/rateLimiter.ts` für Begründung von In-Memory + Fixed-Window).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  clientKeyFromHeaders,
  createRateLimitStore,
  recordRequest,
  DEFAULT_API_RATE_LIMIT,
  type RateLimitOptions,
} from "@/lib/rateLimiter";

function tooManyRequestsResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Zu viele Anfragen. Bitte kurz warten und erneut versuchen." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/**
 * Erzeugt einen eigenständigen Rate-Limiter für eine API-Route. Am Modul-Scope
 * der Route aufrufen (nicht pro Request!), damit der Store über die Lebens-
 * dauer der Server-Instanz erhalten bleibt:
 *
 * ```ts
 * const rateLimit = createApiRateLimiter();
 * export async function POST(req: NextRequest) {
 *   const limited = rateLimit(req);
 *   if (limited) return limited;
 *   // ... eigentliche Route-Logik
 * }
 * ```
 */
export function createApiRateLimiter(options: RateLimitOptions = DEFAULT_API_RATE_LIMIT) {
  const store = createRateLimitStore();

  return function rateLimit(request: NextRequest): NextResponse | null {
    const key = clientKeyFromHeaders(request.headers);
    const now = Date.now();

    const preCheck = checkRateLimit(store, key, now);
    if (preCheck.blocked) return tooManyRequestsResponse(preCheck.retryAfterSeconds);

    const result = recordRequest(store, key, now, options);
    if (result.blocked) return tooManyRequestsResponse(result.retryAfterSeconds);

    return null;
  };
}
