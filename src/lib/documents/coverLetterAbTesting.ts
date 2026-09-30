// -----------------------------------------------------------------------------
// Anschreiben A/B-Varianten & Vergleichs-Generator (Split-Testing)
// -----------------------------------------------------------------------------
// Erzeugt zwei alternative Versionen eines Anschreibens für dieselbe Stelle:
// - Variante A: Technischer Tiefgang, Code-Qualität, Architektur & Best Practices
// - Variante B: Problemlöser, Teamgeist, Agilität & Business-Impact
// -----------------------------------------------------------------------------

export interface CoverLetterVariant {
  id: "A" | "B";
  title: string;
  focus: string;
  openingSentence: string;
  highlightParagraph: string;
  closingSentence: string;
  fullDraft: string;
}

export interface CoverLetterAbComparison {
  companyName: string;
  position: string;
  variantA: CoverLetterVariant;
  variantB: CoverLetterVariant;
}

export function generateCoverLetterAbVariants(params: {
  companyName: string;
  position: string;
  techStack?: string | null;
  applicantName?: string | null;
}): CoverLetterAbComparison {
  const { companyName, position, techStack, applicantName } = params;
  const tech = techStack || "modernen Frontend-Technologien (React, TypeScript)";
  const name = applicantName || "Max Mustermann";

  const openingA = `mit großem Interesse verfolge ich die Entwicklungen bei ${companyName} und bewerbe mich hiermit als ${position}, um meine fundierten Kenntnisse in ${tech} gezielt in Ihre Architekturen einzubringen.`;
  const highlightA = `Als entwicklungsbegeisterter Softwareentwickler liegt mein Fokus auf sauberer Software-Architektur (Clean Code), robuster Typisierung und performanten, wartbaren Benutzeroberflächen. Bei meinen bisherigen Projekten lege ich besonderen Wert auf automatisierte Tests, Skalierbarkeit und barrierefreie UI-Komponenten.`;
  const closingA = `Gerne überzeuge ich Sie in einem persönlichen oder technischen Fachgespräch von meiner Hands-on-Mentalität und Code-Qualität.`;

  const fullA = `Sehr geehrte Damen und Herren,\n\n${openingA}\n\n${highlightA}\n\n${closingA}\n\nMit freundlichen Grüßen\n${name}`;

  const variantA: CoverLetterVariant = {
    id: "A",
    title: "Variante A: Architektur & Tech-Exzellenz",
    focus: "Architektur, Code-Qualität, Typisierung, Skalierbarkeit & Best Practices",
    openingSentence: openingA,
    highlightParagraph: highlightA,
    closingSentence: closingA,
    fullDraft: fullA,
  };

  const openingB = `innovative digitale Produkte entstehen dort, wo Technologie und Teamgeist aufeinandertreffen – genau diesen Mehrwert möchte ich als ${position} für ${companyName} stiften.`;
  const highlightB = `In meiner täglichen Arbeit verbinde ich strukturierte Problemlösungskompetenz mit pragmatischem Vorwärtsdrang. Ob in agilen Scrum-Sprints oder im engen Austausch mit Product Ownern und Designern: Ich verstehe es, komplexe Anforderungen schnell in praxistaugliche Features zu übersetzen und mich proaktiv in neue Teams einzubringen.`;
  const closingB = `Ich freue mich darauf, gemeinsam mit Ihrem Team neue Meilensteine zu erreichen, und sehe einem persönlichen Austausch mit Freude entgegen.`;

  const fullB = `Sehr geehrte Damen und Herren,\n\n${openingB}\n\n${highlightB}\n\n${closingB}\n\nMit freundlichen Grüßen\n${name}`;

  const variantB: CoverLetterVariant = {
    id: "B",
    title: "Variante B: Produkt-Impact & Agiler Teamplayer",
    focus: "Team-Kollaboration, Nutzerfokus, agile Zusammenarbeit & lösungsorientierte Umsetzung",
    openingSentence: openingB,
    highlightParagraph: highlightB,
    closingSentence: closingB,
    fullDraft: fullB,
  };

  return {
    companyName,
    position,
    variantA,
    variantB,
  };
}
