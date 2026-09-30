// -----------------------------------------------------------------------------
// Tag-Suggestion Engine (Heuristik & Pattern-Matching)
// -----------------------------------------------------------------------------
// Schlägt beim Erstellen oder Bearbeiten einer Bewerbung automatisch
// passende Tags basierend auf Position, Tech-Stack und Gehalt vor.
// -----------------------------------------------------------------------------

export interface SuggestionInput {
  position?: string | null;
  techStack?: string | null;
  location?: string | null;
  remote?: boolean | null;
  salaryInfo?: string | null;
  notes?: string | null;
}

export function generateSuggestedTags(input: SuggestionInput): string[] {
  const text = [
    input.position,
    input.techStack,
    input.location,
    input.salaryInfo,
    input.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const suggested = new Set<string>();

  // 1. Remote-Status
  if (input.remote || text.includes("remote") || text.includes("homeoffice") || text.includes("home office")) {
    suggested.add("Remote");
  }

  // 2. Region / Standort
  if (text.includes("bonn")) suggested.add("Bonn");
  if (text.includes("köln") || text.includes("koeln")) suggested.add("Köln");
  if (text.includes("dortmund")) suggested.add("Dortmund");
  if (text.includes("düsseldorf") || text.includes("duesseldorf")) suggested.add("Düsseldorf");

  // 3. Tech-Stack Kernskills
  if (text.includes("react 19") || text.includes("react19")) suggested.add("React19");
  else if (text.includes("react")) suggested.add("React");

  if (text.includes("typescript")) suggested.add("TypeScript");
  if (text.includes("next.js") || text.includes("nextjs") || text.includes("next 15") || text.includes("next 16")) {
    suggested.add("Next.js");
  }
  if (text.includes("tailwind")) suggested.add("Tailwind");

  // 4. Erfahrungslevel / Typ
  if (text.includes("junior") || text.includes("trainee") || text.includes("einstieg")) {
    suggested.add("Junior");
  }
  if (text.includes("startup") || text.includes("start-up")) suggested.add("Startup");
  if (text.includes("konzern") || text.includes("enterprise") || text.includes("bank")) {
    suggested.add("Konzern");
  }
  if (text.includes("agentur")) suggested.add("Agentur");

  // 5. Prioritätsempfehlung (wenn Gehalt oder Tech-Stack besonders attraktiv)
  if (text.includes("prio1") || text.includes("traumjob")) {
    suggested.add("Prio1");
  }

  return Array.from(suggested);
}
