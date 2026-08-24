"use client";

// -----------------------------------------------------------------------------
// In-App Dokumenten-Vorschau Modal (PDF & Bilder)
// -----------------------------------------------------------------------------
import { useEffect } from "react";
import { X, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentPreviewModal({
  open,
  onClose,
  document,
}: {
  open: boolean;
  onClose: () => void;
  document: {
    name: string;
    fileUrl?: string | null;
    mimeType?: string | null;
  } | null;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !document || !document.fileUrl) return null;

  const isPdf = document.mimeType === "application/pdf" || document.fileUrl.endsWith(".pdf");
  const isImage =
    document.mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(document.fileUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 md:p-6 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <p className="truncate font-medium text-foreground text-sm md:text-base">
              {document.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href={document.fileUrl} download target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4" /> Herunterladen
              </Button>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 bg-neutral-900/50 flex items-center justify-center overflow-hidden p-2">
          {isPdf ? (
            <iframe
              src={document.fileUrl}
              title={document.name}
              className="h-full w-full rounded-md border-0 bg-white"
            />
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={document.fileUrl}
              alt={document.name}
              className="max-h-full max-w-full object-contain rounded-md"
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-sm text-muted-foreground">
                Direkte Vorschau für diesen Dateityp nicht verfügbar.
              </p>
              <a href={document.fileUrl} download className="mt-3 inline-block">
                <Button size="sm">
                  <Download className="h-4 w-4" /> Datei herunterladen
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
