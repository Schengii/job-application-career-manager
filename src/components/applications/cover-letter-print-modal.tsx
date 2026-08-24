"use client";

// -----------------------------------------------------------------------------
// DIN 5008 Druck- & PDF-Vorschau Modal für Anschreiben
// -----------------------------------------------------------------------------
import { useRef } from "react";
import { Printer, Copy, X } from "lucide-react";
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

  if (!open) return null;

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
    toast.success("Anschreiben in die Zwischenablage kopiert.");
  }

  // Teilt den Rohtext in Absätze auf
  const paragraphs = content.split("\n\n").map((p) => p.trim()).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Druckansicht (DIN 5008 Layout)</h2>
            <p className="text-xs text-muted-foreground">
              {position} bei {companyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" /> Text kopieren
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Drucken / PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* DIN 5008 Briefbogen */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 md:p-10">
          <div
            ref={printRef}
            id="printable-cover-letter"
            className="mx-auto min-h-[297mm] max-w-[210mm] rounded-sm bg-white p-8 text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100 font-sans text-sm leading-relaxed"
          >
            <div className="whitespace-pre-line font-normal space-y-4">
              {paragraphs.map((p, index) => {
                const isSubject = p.startsWith("Bewerbung als");
                return (
                  <p
                    key={index}
                    className={isSubject ? "text-base font-bold text-neutral-950 dark:text-white pt-2 pb-1" : ""}
                  >
                    {p}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
