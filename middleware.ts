// -----------------------------------------------------------------------------
// Optionaler Passwortschutz für den Fall, dass die App über `localhost`
// hinaus gehostet wird (siehe ausführlichen Kommentar in src/lib/basicAuth.ts).
// -----------------------------------------------------------------------------
// Ohne gesetzte Umgebungsvariable `APP_PASSWORD` verhält sich die App exakt
// wie zuvor (kein Schutz) — das ist der Standardfall für den lokalen
// Dev-Betrieb. Erst wenn `APP_PASSWORD` gesetzt ist (z. B. als Vercel
// Environment Variable), verlangt jede Anfrage HTTP-Basic-Auth mit diesem
// Passwort (Benutzername beliebig).
//
// WICHTIG — bewusst weiterhin `middleware.ts`, NICHT `proxy.ts`:
// Next.js' eigene Doku (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/proxy.md) beschreibt `middleware.ts` als seit v16.0.0
// deprecated zugunsten von `proxy.ts` (Funktion `proxy` statt `middleware`).
// Ein Umbenennungsversuch wurde getestet und wieder rückgängig gemacht: Mit
// Next.js 16.3.2 + Turbopack wird eine `proxy.ts` am Projekt-Root NICHT
// erkannt — `.next/server/middleware-manifest.json` bleibt nach `next build`
// leer (`"middleware": {}, "functions": {}`), wodurch dieser gesamte
// Passwortschutz kommentarlos wirkungslos würde (verifiziert per Build- und
// Manifest-Inspektion, nicht nur vermutet). Erst wieder umbenennen, wenn das
// nachweislich behoben ist (Manifest nach dem Rename tatsächlich prüfen,
// nicht nur den Build-Erfolg).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { isBasicAuthValid } from "@/lib/core/basicAuth";
import { checkRateLimit, clientKeyFromHeaders, createRateLimitStore, recordFailure, recordSuccess } from "@/lib/core/rateLimiter";

export const config = {
  // Schützt auch statische Dateien aus /public (z. B. hochgeladene
  // Zeugnisse/Lebensläufe unter /uploads/*) — nur Next-interne Build-Assets
  // und das Favicon bleiben ungeschützt erreichbar.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};

// Modul-Scope: eine Map pro laufender Server-Instanz, siehe Kommentar in
// src/lib/rateLimiter.ts (warum in-memory statt in der Datenbank).
const authAttempts = createRateLimitStore();

function tooManyAttemptsResponse(retryAfterSeconds: number): NextResponse {
  return new NextResponse("Zu viele fehlgeschlagene Versuche. Bitte später erneut versuchen.", {
    status: 429,
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}

export function middleware(request: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.next();
  }

  const key = clientKeyFromHeaders(request.headers);
  const now = Date.now();

  // Bereits gesperrt? Dann gar nicht erst wieder den (konstante-Zeit-)
  // Passwortvergleich ausführen — verhindert auch, dass ein gesperrter
  // Angreifer per Anfragevolumen weiter Ressourcen verbraucht.
  const lockStatus = checkRateLimit(authAttempts, key, now);
  if (lockStatus.blocked) {
    return tooManyAttemptsResponse(lockStatus.retryAfterSeconds);
  }

  if (isBasicAuthValid(request.headers.get("authorization"), appPassword)) {
    recordSuccess(authAttempts, key);
    return NextResponse.next();
  }

  const result = recordFailure(authAttempts, key, now);
  if (result.blocked) {
    return tooManyAttemptsResponse(result.retryAfterSeconds);
  }

  return new NextResponse("Authentifizierung erforderlich", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Job Application Manager"' },
  });
}
