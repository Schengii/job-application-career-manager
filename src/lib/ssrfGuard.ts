// -----------------------------------------------------------------------------
// SSRF-Schutz für serverseitige Fetches auf nutzerkontrollierte URLs
// -----------------------------------------------------------------------------
// `scrapeJobPostingUrl()` (src/lib/urlJobScraper.ts) ruft eine vom Nutzer
// eingegebene URL serverseitig per `fetch()` ab. Ohne Prüfung könnte diese
// URL auf interne/private Netzwerkadressen zeigen (z. B. `http://localhost`,
// `http://192.168.x.x`, oder bei einem Cloud-Hosting die Metadaten-Endpunkte
// `http://169.254.169.254/...` von AWS/GCP/Azure) — ein klassischer
// Server-Side-Request-Forgery-Angriff (SSRF). Da die App laut
// `src/lib/basicAuth.ts` bewusst auch außerhalb von `localhost` gehostet
// werden kann, muss dieser Endpunkt das verhindern, unabhängig davon, ob
// `APP_PASSWORD` gesetzt ist.
//
// Prüfung in zwei Schritten:
// 1. Nur `http:`/`https:` erlauben, offensichtliche lokale Hostnamen sperren.
// 2. Den Hostnamen per DNS auflösen (bzw. bei IP-Literalen direkt prüfen) und
//    JEDE aufgelöste Adresse gegen private/reservierte IP-Bereiche prüfen.
//    Schritt 2 ist entscheidend gegen DNS-Rebinding: Ein Angreifer könnte
//    sonst einen öffentlichen Hostnamen registrieren, der (zum Zeitpunkt des
//    Fetches) auf eine private Adresse auflöst.
// Da `fetch()` Redirects automatisch folgt, muss außerdem JEDER Redirect-Hop
// erneut geprüft werden (siehe `safeFetchFollowingRedirects` in
// urlJobScraper.ts) — sonst könnte eine zunächst harmlose URL per 302 auf
// eine interne Adresse umleiten.
// -----------------------------------------------------------------------------
import dns from "node:dns/promises";
import net from "node:net";

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
]);

/** Prüft, ob eine IPv4/IPv6-Adresse in einen privaten, reservierten oder Link-Local-Bereich fällt. */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true; // defensiv: unparsbar -> blockieren
    const [a, b] = parts;
    if (a === 0) return true; // "diese" Netzwerk
    if (a === 127) return true; // Loopback (127.0.0.0/8)
    if (a === 10) return true; // Privat (10.0.0.0/8)
    if (a === 172 && b >= 16 && b <= 31) return true; // Privat (172.16.0.0/12)
    if (a === 192 && b === 168) return true; // Privat (192.168.0.0/16)
    if (a === 169 && b === 254) return true; // Link-Local, u.a. Cloud-Metadaten (169.254.0.0/16)
    if (a === 100 && b >= 64 && b <= 127) return true; // Carrier-Grade NAT (100.64.0.0/10)
    if (a >= 224) return true; // Multicast/reserviert (224.0.0.0/4 aufwärts)
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true; // Loopback / unspezifiziert
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6-Adresse -> die eingebettete IPv4-Adresse prüfen
      const v4 = lower.split(":").pop();
      if (v4 && net.isIPv4(v4)) return isPrivateOrReservedIp(v4);
    }
    // Unique Local Addresses (fc00::/7) und Link-Local (fe80::/10)
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
    return false;
  }

  return true; // weder gültiges IPv4 noch IPv6 -> defensiv blockieren
}

/**
 * Wirft eine `UnsafeUrlError`, wenn `urlStr` kein sicheres Fetch-Ziel ist
 * (falsches Protokoll, lokaler Hostname, oder Auflösung auf eine private/
 * reservierte IP-Adresse). Gibt andernfalls die geparste `URL` zurück.
 */
export async function assertPublicHttpUrl(urlStr: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new UnsafeUrlError("Ungültige URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsafeUrlError("Nur http:// und https:// URLs sind erlaubt");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".local")) {
    throw new UnsafeUrlError("Diese Adresse zeigt auf ein lokales/internes Ziel und ist nicht erlaubt");
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new UnsafeUrlError("Diese Adresse zeigt auf ein privates/internes Netzwerk und ist nicht erlaubt");
    }
    return parsed;
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("Hostname konnte nicht aufgelöst werden");
  }

  if (addresses.length === 0) {
    throw new UnsafeUrlError("Hostname konnte nicht aufgelöst werden");
  }

  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new UnsafeUrlError(
        "Diese Adresse löst (u.a.) auf ein privates/internes Netzwerk auf und ist nicht erlaubt"
      );
    }
  }

  return parsed;
}

const MAX_REDIRECTS = 5;

/**
 * `fetch()`-Wrapper, der VOR dem Abruf UND vor jedem einzelnen Redirect-Hop
 * `assertPublicHttpUrl()` durchführt (`redirect: "manual"` statt der
 * `fetch()`-Standardeinstellung "follow"). Ohne das könnte eine zunächst
 * geprüfte, öffentliche URL per 3xx-Redirect auf eine interne Adresse
 * umleiten und den obigen Schutz umgehen.
 */
export async function safeFetchFollowingRedirects(
  urlStr: string,
  init: RequestInit
): Promise<Response> {
  let currentUrl = urlStr;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safeUrl = await assertPublicHttpUrl(currentUrl);
    const res = await fetch(safeUrl, { ...init, redirect: "manual" });

    // Next.js/undici liefert bei `redirect: "manual"` einen opaqueredirect-
    // Response (status 0) ODER einen 3xx mit Location-Header, je nach
    // Runtime — beide Fälle abdecken.
    const isRedirect = res.status >= 300 && res.status < 400;
    if (!isRedirect) return res;

    const location = res.headers.get("location");
    if (!location) return res; // kein Ziel angegeben -> Response so zurückgeben, wie sie ist

    currentUrl = new URL(location, safeUrl).toString();
  }

  throw new UnsafeUrlError("Zu viele Weiterleitungen (Redirect-Loop?)");
}
