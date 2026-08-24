"use client";

// -----------------------------------------------------------------------------
// DIN 5008 Druck- & PDF-Vorschau Modal für Anschreiben mit Signatur
// -----------------------------------------------------------------------------
import { useRef, useState } from "react";
import { Printer, Copy, Download, X, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CoverLetterPrintModal({
  open,
  onClose,
  content,
  position,
  companyName,
}: {
  open: boolean;
  onClose: () => void;
  content: string;
  position: string;
  companyName: string;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [includeSignature, setIncludeSignature] = useState(true);

  if (!open) return null;

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
    toast.success("Anschreiben in die Zwischenablage kopiert.");
  }

  function handleDownloadHtml() {
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Anschreiben - ${position} bei ${companyName}</title>
  <style>
    @page { size: A4; margin: 25mm 20mm 20mm 25mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; }
    .subject { font-weight: bold; font-size: 12pt; margin: 20px 0 15px 0; }
    p { margin-bottom: 12px; }
    .signature { margin-top: 30px; font-style: italic; font-size: 13pt; color: #333; }
  </style>
</head>
<body>
  <div class="content">
    ${content
      .split("\n\n")
      .map((p) => {
        if (p.startsWith("Bewerbung als")) {
          return `<div class="subject">${p}</div>`;
        }
        return `<p>${p.replace(/\n/g, "<br>")}</p>`;
      })
      .join("")}
  </div>
  ${includeSignature ? '<div class="signature">Mit freundlichen Grüßen</div>' : ""}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Anschreiben-${companyName.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Druckfertiges HTML-Anschreiben heruntergeladen.");
  }

  // Teilt den Rohtext in Absätze auf
  const paragraphs = content.split("\n\n").map((p) => p.trim()).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Druckansicht (DIN 5008 Layout)</h2>
            <p className="text-xs text-muted-foreground">
              {position} bei {companyName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIncludeSignature(!includeSignature)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                includeSignature
                  ? "border-primary bg-primary-soft text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-surface-hover"
              }`}
              title="Signatur ein-/ausblenden"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Signatur</span>
            </button>

            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" /> Kopieren
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
              <Download className="h-3.5 w-3.5" /> HTML-Export
            </Button>
            <Button size="sm" onClick={handlePrint} className="card-hover-effect">
              <Printer className="h-3.5 w-3.5" /> Drucken / PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* DIN 5008 Briefbogen */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 md:p-10 bg-surface-hover/30">
          <div
            ref={printRef}
            id="printable-cover-letter"
            className="mx-auto min-h-[297mm] max-w-[210mm] rounded-lg border border-border bg-white p-10 text-neutral-900 shadow-lg dark:bg-neutral-900 dark:text-neutral-100 font-sans text-sm leading-relaxed"
          >
            <div className="whitespace-pre-line font-normal space-y-4">
              {paragraphs.map((p, index) => {
                const isSubject = p.startsWith("Bewerbung als");
                return (
                  <p
                    key={index}
                    className={isSubject ? "text-base font-bold text-neutral-950 dark:text-white pt-3 pb-1 border-b border-border/40" : ""}
                  >
                    {p}
                  </p>
                );
              })}
            </div>

            {includeSignature && (
              <div className="mt-8 pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground">Mit freundlichen Grüßen</p>
                <p className="mt-4 font-serif italic text-base text-primary/80">
                  Digital signiert
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
