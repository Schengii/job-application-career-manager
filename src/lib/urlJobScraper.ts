// -----------------------------------------------------------------------------
// Universal Job URL Scraper & Metadata Extractor
// -----------------------------------------------------------------------------
// Extrahiert strukturierte Daten (JSON-LD schema.org/JobPosting, OpenGraph, HTML)
// aus beliebigen Stellenanzeigen-URLs (Stepstone, Indeed, LinkedIn, Webseiten).
// -----------------------------------------------------------------------------
import { extractTechKeywordsFromText } from "./realJobSearch";
import { SimulatedJobPosting } from "./mockJobPortals";
import { safeFetchFollowingRedirects } from "./ssrfGuard";

export interface ScrapedJobResult {
  job: SimulatedJobPosting;
  sourceUrl: string;
  extractedVia: "JSON_LD" | "OPEN_GRAPH" | "HTML_HEURISTIC";
  success: boolean;
  warnings?: string[];
}

/**
 * Parst JSON-LD schema.org/JobPosting Scripts
 */
function parseJsonLdJob(html: string): Partial<SimulatedJobPosting> | null {
  const jsonLdMatches = html.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
  if (!jsonLdMatches) return null;

  for (const block of jsonLdMatches) {
    try {
      const content = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      const data = JSON.parse(content);

      // Kann ein einzelnes Objekt oder ein @graph Array sein
      const items = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
      const jobItem = items.find((item: Record<string, unknown>) => item["@type"] === "JobPosting");

      if (jobItem) {
        const title = String(jobItem.title || "");
        const description = String(jobItem.description || "").replace(/<[^>]*>?/gm, " ");
        const companyName = String(jobItem.hiringOrganization?.name || jobItem.hiringOrganization || "Unternehmen");
        const location = String(
          jobItem.jobLocation?.address?.addressLocality ||
          jobItem.jobLocation?.address?.addressRegion ||
          "Deutschland"
        );
        const remote = Boolean(
          jobItem.jobLocationType === "TELECOMMUTE" ||
          jobItem.applicantLocationRequirements ||
          description.toLowerCase().includes("remote") ||
          description.toLowerCase().includes("homeoffice")
        );

        let salaryInfo = "";
        if (jobItem.baseSalary?.value?.value) {
          salaryInfo = `${jobItem.baseSalary.value.value} ${jobItem.baseSalary.currency || "EUR"}`;
        } else if (jobItem.estimatedSalary?.value?.value) {
          salaryInfo = `${jobItem.estimatedSalary.value.value} ${jobItem.estimatedSalary.currency || "EUR"}`;
        }

        const techStack = extractTechKeywordsFromText(title + " " + description).join(",");

        return {
          title: title || "Softwareentwickler",
          description: description.slice(0, 1500),
          companyName,
          location,
          remote,
          salaryInfo: salaryInfo || undefined,
          techStack,
        };
      }
    } catch {
      // JSON Parsing Fehler ignorieren und nächste versuchen
    }
  }

  return null;
}

/**
 * Parst OpenGraph & HTML Meta Tags
 */
function parseMetaTags(html: string): Partial<SimulatedJobPosting> {
  const getMeta = (property: string): string => {
    const match = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"));
    return match ? match[1] : "";
  };

  const title = getMeta("og:title") || getMeta("twitter:title") || "";
  const description = getMeta("og:description") || getMeta("twitter:description") || "";
  const siteName = getMeta("og:site_name") || "";

  // Title auflösen (oft im Format "Jobtitel (m/w/d) bei Firmenname in Ort")
  let cleanTitle = title;
  let companyName = siteName || "Unternehmen";

  if (title.includes(" bei ")) {
    const parts = title.split(" bei ");
    cleanTitle = parts[0].trim();
    companyName = parts[1].split("-")[0].split("|")[0].trim();
  } else if (title.includes(" - ")) {
    const parts = title.split(" - ");
    cleanTitle = parts[0].trim();
    if (parts.length > 1) companyName = parts[1].trim();
  }

  const techStack = extractTechKeywordsFromText(cleanTitle + " " + description).join(",");
  const isRemote = (cleanTitle + " " + description).toLowerCase().includes("remote");

  return {
    title: cleanTitle || undefined,
    description: description || undefined,
    companyName: companyName || undefined,
    techStack,
    remote: isRemote,
  };
}

/**
 * Ermittelt die Portalquelle anhand der Domain
 */
export function detectPortalSourceFromUrl(urlStr: string): string {
  try {
    const hostname = new URL(urlStr).hostname.toLowerCase();
    if (hostname.includes("stepstone")) return "STEPSTONE";
    if (hostname.includes("indeed")) return "INDEED";
    if (hostname.includes("get-in-it") || hostname.includes("getinit")) return "GETINIT";
    if (hostname.includes("arbeitsagentur")) return "ARBEITSAGENTUR";
    if (hostname.includes("linkedin")) return "LINKEDIN";
    if (hostname.includes("xing")) return "XING";
    if (hostname.includes("jobware")) return "JOBWARE";
    if (hostname.includes("arbeitnow")) return "ARBEITNOW";
    return "OTHER";
  } catch {
    return "OTHER";
  }
}

/**
 * Haupt-Scraper-Funktion
 */
export async function scrapeJobPostingUrl(targetUrl: string): Promise<ScrapedJobResult> {
  const portalSource = detectPortalSourceFromUrl(targetUrl);

  try {
    // SSRF-Schutz: `assertPublicHttpUrl()` (in `safeFetchFollowingRedirects()`)
    // prüft die URL (und jeden Redirect-Hop) gegen private/interne Netzwerk-
    // adressen, bevor tatsächlich serverseitig gefetcht wird. Siehe
    // src/lib/ssrfGuard.ts für die Begründung.
    const res = await safeFetchFollowingRedirects(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`HTTP Fehler ${res.status}: Konnte URL nicht abrufen.`);
    }

    // Antworten ohne HTML-artigen Content-Type (z.B. Bilder, Binärdateien,
    // die ein Angreifer über eine sonst erlaubte externe URL zurückgeben
    // könnte) werden nicht als Text interpretiert.
    const contentType = res.headers.get("content-type") || "";
    if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new Error(`Unerwarteter Content-Type "${contentType}" — keine HTML-Seite.`);
    }

    // Begrenzung der gelesenen Antwortgröße gegen übermäßig große Downloads.
    const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new Error("Antwort der URL war zu groß (> 5 MB).");
    }
    const html = new TextDecoder("utf-8").decode(buffer);

    // 1. Priorität: JSON-LD Schema
    const jsonLd = parseJsonLdJob(html);
    if (jsonLd && jsonLd.title) {
      return {
        job: {
          title: jsonLd.title,
          description: jsonLd.description || "Stellenbeschreibung aus Anzeige",
          portalSource,
          sourceUrl: targetUrl,
          location: jsonLd.location || "Deutschland",
          remote: jsonLd.remote ?? false,
          requirementsProfile: `Geforderte Kenntnisse: ${jsonLd.techStack || "Frontend / Webentwicklung"}.`,
          techStack: jsonLd.techStack || "TypeScript,React,CSS",
          salaryInfo: jsonLd.salaryInfo || "Nach Absprache",
          companyName: jsonLd.companyName || "Unternehmen",
        },
        sourceUrl: targetUrl,
        extractedVia: "JSON_LD",
        success: true,
      };
    }

    // 2. Priorität: Open Graph Metatags
    const meta = parseMetaTags(html);
    if (meta.title) {
      return {
        job: {
          title: meta.title,
          description: meta.description || "Stellenbeschreibung aus Metadaten",
          portalSource,
          sourceUrl: targetUrl,
          location: "Deutschland / Hybrid",
          remote: meta.remote ?? false,
          requirementsProfile: `Kenntnisse: ${meta.techStack || "Webentwicklung"}.`,
          techStack: meta.techStack || "TypeScript,React,JavaScript,CSS",
          salaryInfo: "Marktüblich",
          companyName: meta.companyName || "Unternehmen",
        },
        sourceUrl: targetUrl,
        extractedVia: "OPEN_GRAPH",
        success: true,
      };
    }

    // 3. Fallback Heuristik aus URL
    const pathname = new URL(targetUrl).pathname;
    const cleanPathTitle = pathname
      .split("/")
      .pop()
      ?.replace(/[-_]/g, " ")
      ?.replace(/\.html?$/i, "")
      ?.trim() || "Web-Entwickler";

    return {
      job: {
        title: cleanPathTitle,
        description: `Stellenangebot importiert von ${targetUrl}`,
        portalSource,
        sourceUrl: targetUrl,
        location: "Bonn / Köln / Remote",
        remote: true,
        requirementsProfile: "Fachinformatiker für Anwendungsentwicklung (Frontend / React).",
        techStack: "TypeScript,JavaScript,React,Next.js,CSS",
        salaryInfo: "Nach Vereinbarung",
        companyName: new URL(targetUrl).hostname.replace(/^www\./, "").split(".")[0],
      },
      sourceUrl: targetUrl,
      extractedVia: "HTML_HEURISTIC",
      success: true,
      warnings: ["Aus der Seite konnten keine strukturierten Metadaten gelesen werden. Bitte Daten prüfen."],
    };
  } catch (error) {
    // Wenn Netzwerk fehlschlägt, erzeuge ein valides Fallback-Objekt aus der URL
    const hostname = (() => {
      try {
        return new URL(targetUrl).hostname.replace(/^www\./, "");
      } catch {
        return "Stellenportal";
      }
    })();

    return {
      job: {
        title: "Frontend Entwickler / Fachinformatiker Anwendungsentwicklung",
        description: `Importierte Stellenanzeige von ${targetUrl}. Hinweis: Automatische Extraktion war eingeschränkt (${(error as Error).message}).`,
        portalSource,
        sourceUrl: targetUrl,
        location: "Bonn / Dortmund / Remote",
        remote: true,
        requirementsProfile: "React, TypeScript, Next.js, HTML5, CSS3",
        techStack: "TypeScript,React,Next.js,CSS",
        salaryInfo: "Marktüblich",
        companyName: hostname,
      },
      sourceUrl: targetUrl,
      extractedVia: "HTML_HEURISTIC",
      success: true,
      warnings: [`Live-Abruf fehlgeschlagen (${(error as Error).message}). Basisdaten wurden vorbefüllt.`],
    };
  }
}
