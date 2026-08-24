// -----------------------------------------------------------------------------
// Job-Portal-Simulator
// -----------------------------------------------------------------------------
// Da ein Live-Scraping von Stepstone/Indeed/GetInIT/Arbeitsagentur rechtlich
// und technisch aufwändig ist (Anti-Bot-Schutz, ToS), simuliert dieses Modul
// realistische Stellenanzeigen für den Bereich "Fachinformatiker
// Anwendungsentwicklung / Frontend" im Raum Bonn/Dortmund/Remote. Die Struktur
// entspricht exakt dem JobPosting-Datenmodell, sodass echte Scraper/APIs
// später 1:1 an derselben Stelle andocken können (einfach diese Funktion durch
// einen echten Adapter ersetzen).
// -----------------------------------------------------------------------------
import { JOB_PORTAL_VALUES } from "./constants";

const COMPANY_POOL = [
  "Rheinwerk Digital GmbH",
  "Dortmunder Softwareschmiede AG",
  "Bonn Cloud Solutions",
  "NRW.digital Systems",
  "Ruhrpixel UG",
  "Deutsche Telekom IT",
  "SAP Innovation Hub Bonn",
  "Adesso SE",
  "Materna Information & Communications SE",
  "codecentric AG",
  "Devbase Solutions GmbH",
  "Vonovia Digital Services",
];

const TITLE_TEMPLATES = [
  "Frontend-Entwickler (m/w/d) TypeScript/React",
  "Fachinformatiker Anwendungsentwicklung (m/w/d) - Frontend",
  "Junior Web Developer (m/w/d) JavaScript/CSS",
  "Software-Entwickler Frontend (m/w/d)",
  "React Developer (m/w/d) - Remote möglich",
  "Anwendungsentwickler (m/w/d) Web Frontend",
  "UI Developer (m/w/d) TypeScript",
];

const LOCATIONS = ["Bonn", "Dortmund", "Köln (Remote möglich)", "Remote", "Essen"];

const TECH_STACK_POOL = [
  "TypeScript,React,CSS,HTML,Next.js",
  "JavaScript,Vue,CSS,SCSS",
  "TypeScript,Angular,CSS,REST",
  "TypeScript,React,Tailwind CSS,GraphQL",
  "JavaScript,CSS,HTML,Node.js",
];

const DESCRIPTION_TEMPLATES = [
  "Wir suchen Verstärkung für unser Frontend-Team: Du entwickelst moderne, responsive Weboberflächen und arbeitest eng mit UX-Designern und Backend-Entwicklern zusammen.",
  "Als Teil unseres agilen Entwicklungsteams gestaltest du Benutzeroberflächen für unsere Web-Anwendungen und sorgst für sauberen, wartbaren Code.",
  "Du übernimmst die Weiterentwicklung unserer Kundenportale im Frontend-Bereich und bringst dich aktiv bei Architekturentscheidungen ein.",
];

const REQUIREMENTS_TEMPLATES = [
  "Abgeschlossene Ausbildung als Fachinformatiker Anwendungsentwicklung oder vergleichbare Qualifikation, gute Kenntnisse in TypeScript/JavaScript und CSS, erste Erfahrung mit React oder vergleichbaren Frameworks.",
  "Erfahrung in der Frontend-Entwicklung mit modernen JS-Frameworks, sicherer Umgang mit HTML5/CSS3, Teamfähigkeit und selbstständige Arbeitsweise.",
  "Kenntnisse in TypeScript, responsive Webdesign, idealerweise erste Praxiserfahrung durch Ausbildung, Umschulung oder eigene Projekte.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type SimulatedJobPosting = {
  title: string;
  description: string;
  portalSource: string;
  sourceUrl: string;
  location: string;
  remote: boolean;
  requirementsProfile: string;
  techStack: string;
  salaryInfo: string;
  companyName: string;
};

/** Erzeugt `count` simulierte, realistische Stellenanzeigen. */
export function generateSimulatedJobPostings(count = 8): SimulatedJobPosting[] {
  return Array.from({ length: count }, (_, i) => {
    const location = pick(LOCATIONS);
    const remote = location.toLowerCase().includes("remote");
    const portalSource = pick(JOB_PORTAL_VALUES.filter((p) => p !== "OTHER"));
    const companyName = pick(COMPANY_POOL);
    const title = pick(TITLE_TEMPLATES);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

    return {
      title,
      description: pick(DESCRIPTION_TEMPLATES),
      portalSource,
      sourceUrl: `https://www.${portalSource.toLowerCase()}.de/stellenangebote/${slug}-${1000 + i}`,
      location,
      remote,
      requirementsProfile: pick(REQUIREMENTS_TEMPLATES),
      techStack: pick(TECH_STACK_POOL),
      salaryInfo: `${38000 + Math.round(Math.random() * 12) * 1000} € - ${48000 + Math.round(Math.random() * 12) * 1000} € / Jahr`,
      companyName,
    };
  });
}
