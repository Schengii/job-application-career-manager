// -----------------------------------------------------------------------------
// Einfache HTTP-Basic-Auth-Prüfung für middleware.ts
// -----------------------------------------------------------------------------
// Diese App wurde für den rein lokalen Einzelnutzer-Betrieb (`localhost`)
// konzipiert und hat daher bewusst keine vollständige Benutzerverwaltung.
// Sobald sie aber über `localhost` hinaus gehostet wird (z. B. Vercel, ein
// eigener Server), wären ohne jeden Schutz alle persönlichen Daten
// (Adresse, Bewerbungsverlauf, hochgeladene Zeugnisse, Notizen) für jeden
// mit der URL öffentlich einsehbar. `middleware.ts` schützt die App daher
// optional mit einem einzigen Passwort (Umgebungsvariable `APP_PASSWORD`).
// Der Benutzername im Basic-Auth-Header wird ignoriert — es zählt
// ausschließlich das Passwort, da die App nur für einen einzigen Nutzer
// gedacht ist. Ist `APP_PASSWORD` nicht gesetzt, bleibt das Verhalten wie
// zuvor (kein Schutz, z. B. für den lokalen Dev-Betrieb).
// -----------------------------------------------------------------------------

/** Konstante-Zeit-Vergleich, um Timing-Angriffe auf den Passwortabgleich zu erschweren. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Prüft einen `Authorization: Basic <base64>`-Header gegen das konfigurierte Passwort. */
export function isBasicAuthValid(authHeader: string | null | undefined, expectedPassword: string): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(authHeader.slice("Basic ".length));
  } catch {
    return false; // ungültiges Base64 -> keine Auth
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;
  const password = decoded.slice(separatorIndex + 1);

  return timingSafeEqual(password, expectedPassword);
}
