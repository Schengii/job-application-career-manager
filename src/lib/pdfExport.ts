// -----------------------------------------------------------------------------
// PDF Export Utility (DIN A4 & High-DPI Document Formatter)
// -----------------------------------------------------------------------------
// Bereitet HTML-Dokumente (Anschreiben nach DIN 5008, Lebenslauf, Interview-Dossier)
// für den direkten PDF-Export und Download auf Server- und Clientseite vor.
// -----------------------------------------------------------------------------

export interface PdfExportOptions {
  title: string;
  htmlContent: string;
  documentType: "COVER_LETTER" | "CV" | "INTERVIEW_DOSSIER";
}

/**
 * Erzeugt ein standardisiertes, druck- und PDF-fertiges HTML-Dokument
 * mit sauberen DIN A4 Seitenrändern, Page-Break-Regeln und CSS Paged Media (@page).
 */
export function wrapHtmlForPdfExport(options: PdfExportOptions): string {
  const { title, htmlContent, documentType } = options;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 20mm 20mm 20mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    // Automatischer Druckdialog beim direkten Öffnen
    if (window.location.search.includes('autoprint=true')) {
      window.onload = () => {
        window.print();
      };
    }
  </script>
</body>
</html>`;
}
