// -----------------------------------------------------------------------------
// Career Manager Clipper - Content Script (DOM & Meta-Extractor)
// -----------------------------------------------------------------------------

function extractJobFromPage() {
  const url = window.location.href;
  let title = "";
  let companyName = "";
  let location = "";
  let description = "";
  let techStack = [];
  let salaryInfo = "";
  let remote = false;

  // 1. Suche nach JSON-LD schema.org/JobPosting
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || "{}");
      const job = data["@type"] === "JobPosting" ? data : (Array.isArray(data["@graph"]) ? data["@graph"].find(x => x["@type"] === "JobPosting") : null);
      if (job) {
        if (job.title) title = job.title;
        if (job.hiringOrganization?.name) companyName = job.hiringOrganization.name;
        if (job.jobLocation?.address?.addressLocality) location = job.jobLocation.address.addressLocality;
        if (job.description) description = job.description.replace(/<[^>]*>/g, " ").trim().slice(0, 800);
        if (job.baseSalary?.value) {
          const val = job.baseSalary.value;
          salaryInfo = typeof val === "object" ? `${val.minValue || ""} - ${val.maxValue || ""} €` : `${val} €`;
        }
        if (job.jobLocationType === "TELECOMMUTE" || job.applicantLocationRequirements) {
          remote = true;
        }
        break;
      }
    } catch {
      // Ignoriere unparsebares JSON
    }
  }

  // 2. OpenGraph Fallback
  if (!title) {
    title = document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
            document.title.replace(/\|.*$/, "").replace(/-.*$/, "").trim();
  }
  if (!companyName) {
    companyName = document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ||
                  document.querySelector('meta[name="author"]')?.getAttribute("content") || "";
  }
  if (!description) {
    description = document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
                  document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  }

  // 3. Portalspezifische DOM-Heuristiken
  if (url.includes("stepstone.de")) {
    title = title || document.querySelector("h1")?.innerText?.trim() || "";
    companyName = companyName || document.querySelector('[data-qa="company-name"]')?.innerText?.trim() || "";
    location = location || document.querySelector('[data-qa="job-location"]')?.innerText?.trim() || "";
  } else if (url.includes("indeed.com")) {
    title = title || document.querySelector("h1.jobsearch-JobInfoHeader-title")?.innerText?.trim() || "";
    companyName = companyName || document.querySelector('[data-company-name="true"]')?.innerText?.trim() || "";
    location = location || document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.innerText?.trim() || "";
  } else if (url.includes("linkedin.com")) {
    title = title || document.querySelector(".top-card-layout__title")?.innerText?.trim() || "";
    companyName = companyName || document.querySelector(".topcard__flavor--black-link")?.innerText?.trim() || "";
    location = location || document.querySelector(".topcard__flavor--bullet")?.innerText?.trim() || "";
  }

  // 4. Tech-Keywords aus dem Volltext extrahieren
  const fullText = (title + " " + description + " " + (document.body?.innerText || "")).slice(0, 8000);
  const knownKeywords = [
    "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Angular",
    "Node.js", "Tailwind", "CSS", "HTML", "REST", "GraphQL", "Prisma",
    "SQLite", "PostgreSQL", "MySQL", "Docker", "Git", "Vitest", "Jest",
    "Redux", "Zustand", "SWR", "Figma", "CI/CD", "AWS"
  ];
  for (const kw of knownKeywords) {
    const reg = new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i");
    if (reg.test(fullText)) {
      techStack.push(kw);
    }
  }

  // 5. Remote-Erkennung
  if (!remote) {
    const textLower = fullText.toLowerCase();
    remote = textLower.includes("remote") || textLower.includes("home-office") || textLower.includes("homeoffice");
  }

  // 6. Ansprechpartner & Recruiter-Erkennung
  let contactName = "";
  let contactEmail = "";

  const contactMatch = fullText.match(/(?:Ansprechpartner(?:in)?|Kontakt(?:person)?|Recruiter(?:in)?|Hiring Manager|Ihre Ansprechpartner):\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,2})/i);
  if (contactMatch) {
    contactName = contactMatch[1].trim();
  }

  const mailMatch = fullText.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  if (mailMatch) {
    const candidate = mailMatch[1].toLowerCase();
    if (!candidate.endsWith(".png") && !candidate.endsWith(".jpg") && !candidate.includes("sentry")) {
      contactEmail = candidate;
    }
  }

  return {
    title: title || "Frontend Entwickler (React/TypeScript)",
    companyName: companyName || "IT-Unternehmen",
    location: location || "NRW / Remote",
    remote,
    description: description.slice(0, 1000) || `Stellenangebot via Browser-Clipper erfasst (${url}).`,
    techStack: techStack.join(", "),
    salaryInfo: salaryInfo || undefined,
    contactName: contactName || undefined,
    contactEmail: contactEmail || undefined,
    sourceUrl: url,
  };
}

// Listener für Anfragen vom Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_JOB_DATA") {
    const data = extractJobFromPage();
    sendResponse(data);
  }
  return true;
});
