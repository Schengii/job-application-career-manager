// -----------------------------------------------------------------------------
// Erweiterter Job-Portal-Simulator & Multi-Portal Synchronisations-Engine
// -----------------------------------------------------------------------------
// Simuliert & aggregiert realistische Stellenanzeigen für den Bereich:
// "Fachinformatiker Anwendungsentwicklung (Frontend / React / TypeScript / Web)"
// aus allen relevanten Jobportalen:
// - Stepstone, Indeed, GetInIT, LinkedIn, Xing, Agentur für Arbeit, Monster, Honeypot, Arbeitnow
// -----------------------------------------------------------------------------

export interface SimulatedJobPosting {
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
}

const EXTENDED_COMPANIES = [
  // Bonn & Region Köln / Rheinland
  "Deutsche Telekom IT GmbH",
  "Rheinwerk Digital Solutions",
  "SAP Innovation Hub Bonn",
  "Sipgate GmbH (Düsseldorf / Remote)",
  "Trusted Shops AG (Köln)",
  "REWE digital GmbH (Köln)",
  "trivago N.V. (Düsseldorf)",
  "Bonn Cloud Systems",
  "inovex GmbH (Köln / Bonn)",
  "iteratec GmbH (Köln)",
  "DeepL SE (Köln / Remote)",
  "Fraunhofer-Institut FIT (Sankt Augustin / Bonn)",
  "Generali Deutschland IT",
  "Ströer Digital Media (Köln)",
  "Ford Smart Mobility (Köln)",

  // Dortmund & Ruhrgebiet
  "adesso SE (Dortmund)",
  "Materna Information & Communications SE (Dortmund)",
  "codecentric AG (Dortmund / Solingen)",
  "Dortmunder Softwareschmiede AG",
  "Ruhrpixel Interactive GmbH (Essen)",
  "Vonovia Digital Services (Bochum)",
  "Comline Elektronik / IT (Dortmund)",
  "G DATA CyberDefense AG (Bochum)",
  "thyssenkrupp Digital Projects (Essen)",
  "Stadt Dortmund IT-Service",

  // Deutschlandweit / Vollständig Remote
  "CHECK24 IT Services (Remote)",
  "Scout24 SE (Remote)",
  "Zalando Tech Hub (Remote)",
  "Personio Developer Team (Remote)",
  "Shopware AG (Remote)",
  "Otto Group Digital (Remote)",
  "Jimdo Web Tech (Remote)",
  "Finanz Informatik (Münster / Frankfurt)",
  "Siemens Digital Industries (Remote)",
  "BMW Group IT Hub (Remote)",
  "1&1 Versatel Digital (Düsseldorf)",
];

const EXTENDED_TITLES = [
  "Frontend-Entwickler (m/w/d) TypeScript & React",
  "Fachinformatiker Anwendungsentwicklung (m/w/d) - Frontend",
  "Junior Frontend Developer (m/w/d) React / Next.js",
  "Software-Entwickler Web-Frontend (m/w/d)",
  "React & TypeScript Developer (m/w/d) - Remote",
  "Web Developer (m/w/d) JavaScript / CSS / Tailwind",
  "Junior Fullstack Developer (m/w/d) Schwerpunkt Frontend",
  "UI/UX Frontend Engineer (m/w/d)",
  "Anwendungsentwickler Web (m/w/d) - App Router & Next.js",
  "Junior Software Engineer (m/w/d) Frontend & Component Libraries",
  "Frontend Developer (m/w/d) mit React & Clean Architecture",
  "Fachinformatiker / Quereinsteiger (m/w/d) Webentwicklung",
];

const EXTENDED_LOCATIONS = [
  { city: "Bonn", remote: false },
  { city: "Köln", remote: false },
  { city: "Köln (Hybrid / 2 Tage HO)", remote: false },
  { city: "Dortmund", remote: false },
  { city: "Düsseldorf", remote: false },
  { city: "Essen", remote: false },
  { city: "Bochum", remote: false },
  { city: "Bonn (100% Remote)", remote: true },
  { city: "Dortmund (100% Remote)", remote: true },
  { city: "Deutschlandweit (100% Remote)", remote: true },
  { city: "Remote (DACH)", remote: true },
];

const EXTENDED_TECH_STACKS = [
  "TypeScript,React,Next.js,Tailwind CSS,REST,Git",
  "TypeScript,React,CSS Grid,Flexbox,Vitest,Zod",
  "JavaScript,TypeScript,React,HTML5,CSS3,Redux Toolkit",
  "TypeScript,Next.js,React 19,Tailwind CSS,Shadcn UI",
  "TypeScript,React,REST APIs,Git,CI/CD,Unit Testing",
  "TypeScript,Vue.js,Tailwind CSS,REST,Git",
  "TypeScript,Angular,SCSS,REST,Docker",
  "JavaScript,React,Node.js,SQLite,Prisma,Tailwind CSS",
  "TypeScript,React,State Management,Responsive Design,A11y",
  "TypeScript,Next.js,GraphQL,REST,Vitest,Tailwind CSS",
];

const EXTENDED_DESCRIPTIONS = [
  "Für unser modernes Frontend-Team suchen wir engagierte Entwickler: Du baust responsive, barrierefreie Webanwendungen mit React und TypeScript und arbeitest eng mit Product Ownern und UX-Designern zusammen.",
  "In einem agilen Scrum-Team entwickelst du innovative Kundenportale und Web-Apps. Du legst großen Wert auf sauberen, wartbaren Code, automatisierte Tests mit Vitest und moderne CSS-Architektur.",
  "Du gestaltest unsere SaaS-Plattform aktiv mit: Von der Konzeption interaktiver UI-Komponenten bis zur performanten API-Anbindung (REST/Zod) setzt du moderne Best Practices um.",
  "Verstärke unser Software-Engineering-Team bei der Modernisierung unserer Web-Architektur. Wir bieten state-of-the-art Tech-Stacks (Next.js App Router, TypeScript, Tailwind) und individuelle Weiterbildung.",
  "Du übernimmst Verantwortung für ansprechende Benutzeroberflächen unserer Core-Produkte. Wir fördern Praxisprojekte, Code-Reviews und bieten flexible Arbeitszeiten mit Home-Office-Option.",
];

const EXTENDED_REQUIREMENTS = [
  "Abgeschlossene Ausbildung als Fachinformatiker Anwendungsentwicklung, fundierte Umschulung oder vergleichbare Praxiserfahrung. Gute Kenntnisse in TypeScript, React, HTML5 und CSS3/Tailwind.",
  "Erste Praxiserfahrung in der agilen Webentwicklung (z. B. durch Ausbildung, Praxisprojekte oder Referenz-Apps). Sicherer Umgang mit Git und REST-Schnittstellen.",
  "Leidenschaft für modernes Frontend-Design, Clean Code und Test-Driven Development. Kenntnisse in React Hooks, State Management und responsivem Webdesign.",
  "Erfahrung im Umgang mit modernen JavaScript/TypeScript-Frameworks (React, Next.js). Hohe Lernbereitschaft, Teamplayer-Mentalität und strukturierte Arbeitsweise.",
  "Solide Kenntnisse in Web-Standards (DOM, Event-Loop, A11y) sowie CSS Grid und Flexbox. Verständnis für API-Architekturen und Zod-Validierung.",
];

export const SUPPORTED_PORTALS = [
  { id: "Stepstone", name: "StepStone", urlDomain: "stepstone.de" },
  { id: "Indeed", name: "Indeed", urlDomain: "de.indeed.com" },
  { id: "GetInIT", name: "Get in IT", urlDomain: "get-in-it.de" },
  { id: "LinkedIn", name: "LinkedIn Jobs", urlDomain: "linkedin.com/jobs" },
  { id: "Xing", name: "XING Stellenmarkt", urlDomain: "xing.com/jobs" },
  { id: "Arbeitsagentur", name: "Bundesagentur für Arbeit", urlDomain: "arbeitsagentur.de/jobsuche" },
  { id: "Monster", name: "Monster", urlDomain: "monster.de" },
  { id: "Honeypot", name: "Honeypot.io", urlDomain: "honeypot.io" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSalary(): string {
  const min = 40000 + Math.round(Math.random() * 10) * 1000;
  const max = min + 6000 + Math.round(Math.random() * 8) * 1000;
  return `${min.toLocaleString("de-DE")} € – ${max.toLocaleString("de-DE")} € / Jahr`;
}

/** Erzeugt simulierte Stellenanzeigen (optional gefiltert nach bestimmtem Portal). */
export function generateSimulatedJobPostings(count = 12, targetPortal?: string): SimulatedJobPosting[] {
  const results: SimulatedJobPosting[] = [];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < count; i++) {
    const loc = pick(EXTENDED_LOCATIONS);
    const portal = targetPortal && targetPortal !== "ALL"
      ? SUPPORTED_PORTALS.find((p) => p.id === targetPortal) || pick(SUPPORTED_PORTALS)
      : pick(SUPPORTED_PORTALS);

    const companyName = pick(EXTENDED_COMPANIES);
    const title = pick(EXTENDED_TITLES);
    const slugBase = `${companyName}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 45);
    const uniqueId = 1000 + Math.floor(Math.random() * 9000);
    const fullSlug = `${slugBase}-${uniqueId}`;

    if (usedSlugs.has(fullSlug)) continue;
    usedSlugs.add(fullSlug);

    results.push({
      title,
      description: pick(EXTENDED_DESCRIPTIONS),
      portalSource: portal.id,
      sourceUrl: `https://${portal.urlDomain}/view/${fullSlug}`,
      location: loc.city,
      remote: loc.remote,
      requirementsProfile: pick(EXTENDED_REQUIREMENTS),
      techStack: pick(EXTENDED_TECH_STACKS),
      salaryInfo: getRandomSalary(),
      companyName,
    });
  }

  return results;
}

/**
 * Erzeugt einen kompletten Sync-Lauf über alle angebundenen Jobportale
 * (z. B. 2-3 frische Angebote pro Portal).
 */
export function generateMultiPortalBatch(perPortalCount = 3): SimulatedJobPosting[] {
  const batch: SimulatedJobPosting[] = [];
  for (const portal of SUPPORTED_PORTALS) {
    const portalJobs = generateSimulatedJobPostings(perPortalCount, portal.id);
    batch.push(...portalJobs);
  }
  return batch;
}
