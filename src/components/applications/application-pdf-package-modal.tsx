"use client";

// -----------------------------------------------------------------------------
// Bewerbungsmappen-Builder Modal: Zusammenstellung & Download des PDF-Pakets
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  MoveUp,
  MoveDown,
  Archive,
  Layers,
  Sparkles,
  X,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export type ApplicationDocumentItem = {
  id: string;
  name: string;
  category: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

export type ApplicationPdfPackageModalProps = {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  companyName: string;
  position: string;
  hasCoverLetter?: boolean;
  documents: ApplicationDocumentItem[];
};

export function ApplicationPdfPackageModal({
  open,
  onClose,
  applicationId,
  companyName,
  position,
  hasCoverLetter = true,
  documents,
}: ApplicationPdfPackageModalProps) {
  const toast = useToast();

  const [includeCoverSheet, setIncludeCoverSheet] = useState(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(hasCoverLetter);
  const [docList, setDocList] = useState<ApplicationDocumentItem[]>(documents);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(
    new Set(documents.map((d) => d.id))
  );
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync if documents prop changes
  useMemo(() => {
    setDocList(documents);
    setSelectedDocIds(new Set(documents.map((d) => d.id)));
  }, [documents]);

  if (!open) return null;

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function moveDoc(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= docList.length) return;
    const copy = [...docList];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    setDocList(copy);
  }

  // Schätzung der Dateigröße & Seiten
  const selectedDocs = docList.filter((d) => selectedDocIds.has(d.id));
  const estimatedPages =
    (includeCoverSheet ? 1 : 0) +
    (includeCoverLetter ? 1 : 0) +
    selectedDocs.reduce((acc, doc) => acc + (doc.category === "LEBENSLAUF" ? 2 : 1), 0);

  const totalRawSize = selectedDocs.reduce((acc, doc) => acc + (doc.fileSize || 200_000), 0);
  // Kompression durch Sharp/pdf-lib schrumpft Bilder & PDFs meist um ~40%
  const estimatedMb = ((totalRawSize * 0.6 + 80_000) / (1024 * 1024)).toFixed(1);

  async function handleDownloadPdf() {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams({
        includeCoverSheet: includeCoverSheet ? "true" : "false",
        includeCoverLetter: includeCoverLetter ? "true" : "false",
        documentIds: selectedDocs.map((d) => d.id).join(","),
      });

      const url = `/api/applications/${applicationId}/pdf-package?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fehler beim Erstellen der Bewerbungsmappe.");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const safeCompany = companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const safePos = position.replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Bewerbungsmappe_${safeCompany}_${safePos}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Bewerbungsmappe erfolgreich heruntergeladen!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Download fehlgeschlagen");
    } finally {
      setIsDownloading(false);
    }
  }

  function handleDownloadZip() {
    window.open(`/api/applications/${applicationId}/package`, "_blank");
    toast.success("ZIP-Download gestartet.");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Bewerbungsmappen-Builder</h2>
              <p className="text-xs text-muted-foreground">
                Zusammenstellen & Exportieren als einheitliche PDF für {companyName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-5">
          {/* Deckblatt & Anschreiben Optionen */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Einstiegs-Dokumente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setIncludeCoverSheet(!includeCoverSheet)}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                  includeCoverSheet
                    ? "border-primary bg-primary-soft/30"
                    : "border-border bg-surface-hover/30 text-muted-foreground"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    includeCoverSheet
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-transparent"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Premium Deckblatt
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Professionelle Titelseite mit Kontaktdaten & Anlagenverzeichnis
                  </p>
                </div>
              </div>

              <div
                onClick={() => hasCoverLetter && setIncludeCoverLetter(!includeCoverLetter)}
                className={`flex items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                  !hasCoverLetter
                    ? "opacity-50 cursor-not-allowed border-border bg-surface-hover/20"
                    : includeCoverLetter
                    ? "cursor-pointer border-primary bg-primary-soft/30"
                    : "cursor-pointer border-border bg-surface-hover/30 text-muted-foreground"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    includeCoverLetter
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-transparent"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> DIN 5008 Anschreiben
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {hasCoverLetter
                      ? "Generiertes & formatiertes Anschreiben für diese Stelle"
                      : "Kein Anschreiben für diese Bewerbung hinterlegt"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Angehängte Dokumente & Reihenfolge */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Angehängte Nachweise & Reihenfolge ({selectedDocs.length}/{docList.length})
              </h3>
            </div>

            {docList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                Keine zusätzlichen Dokumente (Lebenslauf, Zeugnisse) an dieser Bewerbung angehängt.
              </div>
            ) : (
              <div className="space-y-2">
                {docList.map((doc, idx) => {
                  const isSelected = selectedDocIds.has(doc.id);
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-border bg-surface"
                          : "border-border/60 bg-surface-hover/20 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleDoc(doc.id)}
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-surface text-transparent"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Kategorie: {doc.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveDoc(idx, -1)}
                          className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
                          title="Nach oben verschieben"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === docList.length - 1}
                          onClick={() => moveDoc(idx, 1)}
                          className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
                          title="Nach unten verschieben"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Zusammenfassungs-Card */}
          <div className="rounded-lg border border-primary/20 bg-primary-soft/20 p-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Gesamtumfang:</span>
                <span className="text-muted-foreground">~{estimatedPages} Seiten</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Geschätzte Größe:</span>
                <span className="font-bold text-primary">~{estimatedMb} MB</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 text-success shrink-0" />
              Automatisch komprimiert & DIN A4 formatiert für Standard-Bewerberportale (Limit meist 5-10 MB).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 bg-surface-hover/30">
          <Button variant="outline" size="sm" onClick={handleDownloadZip}>
            <Archive className="h-4 w-4 mr-1.5" /> Als ZIP-Archiv
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="shadow-sm font-semibold"
            >
              <Download className="h-4 w-4 mr-1.5" />
              {isDownloading ? "Erzeuge PDF …" : "Komplette PDF herunterladen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
