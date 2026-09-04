// -----------------------------------------------------------------------------
// DIN 5008 1-Seiten-Wächter & Überlängen-Radar
// -----------------------------------------------------------------------------
// Berechnet für ein Anschreiben die geschätzte DIN A4 Seitenbelegung nach
// DIN 5008 Form B (11pt Schrift, 1.25 Zeilenabstand, Standard-Ränder 25mm links,
// 20mm rechts, 45mm oben inkl. Briefkopf).
// Verhindert, dass ein Anschreiben unbemerkt um wenige Zeilen auf Seite 2 umbricht.
// -----------------------------------------------------------------------------

export type Din5008Status = "OPTIMAL" | "WARNING" | "OVERFLOW";

export type Din5008Metrics = {
  bodyLines: number;
  totalEstimatedLines: number;
  maxPageLines: number; // Empfohlenes Maximum für exakt 1 DIN A4 Seite (ca. 48 Zeilen)
  fillPercentage: number; // 0 - 100%+
  characterCount: number;
  wordCount: number;
  status: Din5008Status;
  statusLabel: string;
  advice: string;
};

// Ca. 80-85 Zeichen pro Zeile bei 11pt und Standardrändern
const CHARS_PER_LINE = 82;
// Fester Zeilenbedarf für Briefkopf, Anschrift, Datum, Betreff, Gruß & Unterschrift
const FIXED_OVERHEAD_LINES = 20;
// Maximale Zeilenanzahl auf einer einzelnen DIN A4 Seite
const MAX_A4_PAGE_LINES = 48;

export function calculateDin5008Metrics(content: string): Din5008Metrics {
  const trimmed = content.trim();
  if (!trimmed) {
    return {
      bodyLines: 0,
      totalEstimatedLines: FIXED_OVERHEAD_LINES,
      maxPageLines: MAX_A4_PAGE_LINES,
      fillPercentage: Math.round((FIXED_OVERHEAD_LINES / MAX_A4_PAGE_LINES) * 100),
      characterCount: 0,
      wordCount: 0,
      status: "OPTIMAL",
      statusLabel: "Leer / Entwurf",
      advice: "Füge Text ein, um die DIN 5008 Seitenbelegung zu prüfen.",
    };
  }

  const paragraphs = trimmed.split(/\n+/);
  let bodyLines = 0;

  for (const p of paragraphs) {
    const pTrimmed = p.trim();
    if (!pTrimmed) continue;
    // Jede Zeile berechnen + Umbrüche bei Überschreiten der Zeichengrenze
    const linesInParagraph = Math.max(1, Math.ceil(pTrimmed.length / CHARS_PER_LINE));
    bodyLines += linesInParagraph;
    // Leerzeile als Absatzabstand addieren
    bodyLines += 1;
  }

  // Letzte Leerzeile abziehen
  if (bodyLines > 0) bodyLines -= 1;

  const totalEstimatedLines = FIXED_OVERHEAD_LINES + bodyLines;
  const fillPercentage = Math.round((totalEstimatedLines / MAX_A4_PAGE_LINES) * 100);

  const characterCount = trimmed.length;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  let status: Din5008Status = "OPTIMAL";
  let statusLabel = "Optimal (1 Seite)";
  let advice = "Perfekt! Das Anschreiben passt vollständig und harmonisch auf genau 1 DIN A4 Seite.";

  if (fillPercentage > 100) {
    status = "OVERFLOW";
    const overflowLines = totalEstimatedLines - MAX_A4_PAGE_LINES;
    statusLabel = `Überlänge (+${overflowLines} Zeilen auf Seite 2)`;
    advice = `Achtung: Das Anschreiben bricht um ca. ${overflowLines} Zeile(n) auf eine 2. Seite um. Kürze 1–2 Sätze für ein professionelles 1-Seiten-Format.`;
  } else if (fillPercentage >= 88) {
    status = "WARNING";
    statusLabel = "Grenzbereich (88–100%)";
    advice = "Das Anschreiben füllt die Seite fast vollständig aus. Prüfe in der Druckvorschau, ob kein Zeilenüberlauf entsteht.";
  } else if (fillPercentage < 55) {
    statusLabel = "Sehr kompakt (<55%)";
    advice = "Das Anschreiben ist recht kurz. Du hast noch ausreichend Platz, um Projekterfahrungen oder Tech-Skills zu ergänzen.";
  }

  return {
    bodyLines,
    totalEstimatedLines,
    maxPageLines: MAX_A4_PAGE_LINES,
    fillPercentage,
    characterCount,
    wordCount,
    status,
    statusLabel,
    advice,
  };
}
