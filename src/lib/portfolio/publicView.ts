// -----------------------------------------------------------------------------
// Öffentliche Recruiter-Ansicht des Portfolios (serverseitige Zugriffsprüfung)
// -----------------------------------------------------------------------------
// Die Seite /portfolio/[token] ist ohne App-Passwort erreichbar und darf daher
// niemals die vollständigen Preferences laden (enthalten u. a. die PIN und
// Gehaltswünsche). Stattdessen prüft dieses Modul Token, Aktiv-Flag,
// Ablaufdatum und PIN auf dem Server und liefert ausschließlich die für
// Recruiter bestimmten Felder.
// -----------------------------------------------------------------------------
import { timingSafeEqual } from "@/lib/core/basicAuth";

export type PortfolioAccessInput = {
  portfolioShareToken: string | null;
  portfolioActive: boolean;
  portfolioTokenExpiresAt: Date | null;
  portfolioPin: string | null;
};

export type PortfolioAccessResult = "ok" | "invalid" | "pin_required" | "pin_wrong";

export function checkPortfolioAccess(
  prefs: PortfolioAccessInput | null,
  token: string,
  pin: string | undefined,
  now: Date = new Date(),
): PortfolioAccessResult {
  if (!prefs || !prefs.portfolioShareToken || !prefs.portfolioActive) return "invalid";
  if (!timingSafeEqual(prefs.portfolioShareToken, token)) return "invalid";
  if (prefs.portfolioTokenExpiresAt && prefs.portfolioTokenExpiresAt.getTime() < now.getTime()) return "invalid";

  if (prefs.portfolioPin) {
    if (pin === undefined || pin === "") return "pin_required";
    if (!timingSafeEqual(prefs.portfolioPin, pin)) return "pin_wrong";
  }
  return "ok";
}

export type PublicProject = {
  id: string;
  title: string;
  role: string | null;
  description: string | null;
  techStack: string | null;
  url: string | null;
};

export type PublicEducation = {
  id: string;
  title: string;
  institution: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

export type PublicPortfolio = {
  fullName: string | null;
  desiredRole: string | null;
  profileSummary: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  techStack: string | null;
  projectEntries: PublicProject[];
  educationEntries: PublicEducation[];
};

type PublicSource = {
  fullName?: string | null;
  desiredRole?: string | null;
  profileSummary?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  techStack?: string | null;
  projectEntries: PublicProject[];
  educationEntries: (Omit<PublicEducation, "startDate" | "endDate"> & { startDate: Date | null; endDate: Date | null })[];
};

/** Allowlist-Mapping: nur diese Felder verlassen den Server. */
export function toPublicPortfolio(prefs: PublicSource): PublicPortfolio {
  return {
    fullName: prefs.fullName ?? null,
    desiredRole: prefs.desiredRole ?? null,
    profileSummary: prefs.profileSummary ?? null,
    city: prefs.city ?? null,
    email: prefs.email ?? null,
    phone: prefs.phone ?? null,
    techStack: prefs.techStack ?? null,
    projectEntries: prefs.projectEntries.map((p) => ({
      id: p.id,
      title: p.title,
      role: p.role,
      description: p.description,
      techStack: p.techStack,
      url: p.url,
    })),
    educationEntries: prefs.educationEntries.map((e) => ({
      id: e.id,
      title: e.title,
      institution: e.institution,
      startDate: e.startDate ? e.startDate.toISOString() : null,
      endDate: e.endDate ? e.endDate.toISOString() : null,
      description: e.description,
    })),
  };
}
