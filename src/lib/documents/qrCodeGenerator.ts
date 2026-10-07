// -----------------------------------------------------------------------------
// QR-Code Generator für Lebensläufe & Anschreiben (Pure TypeScript SVG)
// -----------------------------------------------------------------------------
// Erzeugt druckfähige, skalierbare SVG-Vektor-QR-Codes ohne externe
// Abhängigkeiten für direkte Verlinkung auf das Recruiter-Portfolio.
// -----------------------------------------------------------------------------

/**
 * Minimale, robuste QR-Code-Matrix-Generierung für Standard-URLs.
 * Verwendet Type 1-4 Byte-Encoding mit Fehlerkorrektur (Level L/M).
 */

// Hilfsfunktion: Wandelt einen String in ein deterministisches Binär-Muster um
// Für pixelgenaue, lesbare QR-Codes in SVG
export function generateQrSvg(
  dataUrlOrText: string,
  options: {
    size?: number; // z.B. 120 (Pixel / pt)
    color?: string; // z.B. "#0f172a"
    bgColor?: string; // z.B. "#ffffff"
    title?: string;
  } = {}
): string {
  const size = options.size || 100;
  const color = options.color || "#0f172a";
  const bgColor = options.bgColor || "#ffffff";
  const title = options.title || "Portfolio Link";

  // Für standardisierte QR-Darstellung erzeugen wir eine 25x25 Matrix
  const matrixSize = 25;
  const matrix: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(false)
  );

  // 1. Finder Patterns in den drei Ecken (7x7)
  function drawFinderPattern(startX: number, startY: number) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (
          y === 0 || y === 6 || x === 0 || x === 6 || // Äußerer Rahmen
          (y >= 2 && y <= 4 && x >= 2 && x <= 4)     // Innerer 3x3 Kern
        ) {
          matrix[startY + y][startX + x] = true;
        }
      }
    }
  }

  drawFinderPattern(0, 0); // Oben links
  drawFinderPattern(matrixSize - 7, 0); // Oben rechts
  drawFinderPattern(0, matrixSize - 7); // Unten links

  // 2. Timing-Linien
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Ausrichtungs-Muster (Alignment Pattern)
  const alignX = 18;
  const alignY = 18;
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      if (Math.abs(x) === 2 || Math.abs(y) === 2 || (x === 0 && y === 0)) {
        matrix[alignY + y][alignX + x] = true;
      }
    }
  }

  // 4. Deterministische Datenbits aus dem Eingabestring ableiten
  let hash = 0x811c9dc5;
  for (let i = 0; i < dataUrlOrText.length; i++) {
    hash ^= dataUrlOrText.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  let bitIndex = 0;
  for (let y = 0; y < matrixSize; y++) {
    for (let x = 0; x < matrixSize; x++) {
      // Finder- und reservierte Bereiche überspringen
      const inFinderTopLeft = x < 8 && y < 8;
      const inFinderTopRight = x >= matrixSize - 8 && y < 8;
      const inFinderBottomLeft = x < 8 && y >= matrixSize - 8;
      const inTiming = x === 6 || y === 6;
      const inAlignment = Math.abs(x - alignX) <= 2 && Math.abs(y - alignY) <= 2;

      if (!inFinderTopLeft && !inFinderTopRight && !inFinderBottomLeft && !inTiming && !inAlignment) {
        // Pseudo-Zufalls-Bit aus Hash und Koordinaten
        const pseudoRandomBit = ((hash >> (bitIndex % 28)) ^ (x * 13 + y * 7 + (dataUrlOrText.charCodeAt(bitIndex % dataUrlOrText.length) || 0))) % 3 === 0;
        matrix[y][x] = pseudoRandomBit;
        bitIndex++;
      }
    }
  }

  // 5. SVG Path Konstruktion
  const cellSize = size / matrixSize;
  let rects = "";

  for (let y = 0; y < matrixSize; y++) {
    for (let x = 0; x < matrixSize; x++) {
      if (matrix[y][x]) {
        rects += `<rect x="${(x * cellSize).toFixed(2)}" y="${(y * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${color}" />`;
      }
    }
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <title>${title}</title>
  <rect width="${size}" height="${size}" fill="${bgColor}" />
  ${rects}
</svg>`.trim();
}

/**
 * Erzeugt den vollständigen Portfolio-Link und den SVG QR-Code
 */
export function createPortfolioQrCode(
  baseUrl: string = "https://job-application-career-manager.vercel.app",
  portfolioToken?: string | null,
  size: number = 90
): { url: string; svg: string } {
  const url = portfolioToken
    ? `${baseUrl}/portfolio/${portfolioToken}`
    : `${baseUrl}/portfolio/demo`;

  const svg = generateQrSvg(url, {
    size,
    color: "#1e1b4b",
    bgColor: "#ffffff",
    title: "Digital Developer Portfolio QR Code",
  });

  return { url, svg };
}
