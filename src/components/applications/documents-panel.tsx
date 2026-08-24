"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { FileText, Trash2, Plus, Eye, Download } from "lucide-react";
import { fetcher, apiPost, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DOCUMENT_CATEGORIES, findStatusMeta } from "@/lib/constants";
import type { ApplicationDetail, Document } from "@/types";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

export function DocumentsPanel({
  application,
  onChange,
}: {
  application: ApplicationDetail;
  onChange: () => void;
}) {
  const toast = useToast();
  const { data: library } = useSWR<Document[]>("/api/documents", fetcher);
  const [selected, setSelected] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const attachedIds = new Set(application.documents.map((d) => d.documentId));
  const available = (library ?? []).filter((d) => !attachedIds.has(d.id));

  async function handleAttach() {
    if (!selected) return;
    setAttaching(true);
    try {
      await apiPost(`/api/applications/${application.id}/documents`, { documentId: selected });
      onChange();
      setSelected("");
      toast.success("Dokument angehängt.");
    } catch {
      toast.error("Dokument konnte nicht angehängt werden.");
    } finally {
      setAttaching(false);
    }
  }

  async function handleRemove(documentId: string) {
    try {
      await apiDelete(`/api/applications/${application.id}/documents?documentId=${documentId}`);
      onChange();
      toast.success("Dokument entfernt.");
    } catch {
      toast.error("Entfernen fehlgeschlagen.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <p className="text-xs text-muted-foreground">
          {application.documents.length} Dokument(e) zugeordnet
        </p>
        <a href={`/api/applications/${application.id}/package`} download>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Bewerbungspaket (ZIP) herunterladen
          </Button>
        </a>
      </div>

      {application.documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Dieser Bewerbung sind noch keine Dokumente zugeordnet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {application.documents.map(({ document, documentId }) => (
            <li
              key={documentId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-surface-hover/40 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{document.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {findStatusMeta(DOCUMENT_CATEGORIES, document.category)?.label ?? document.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {document.fileUrl && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewDoc(document)}
                      aria-label={`${document.name} in App ansehen`}
                      title="Vorschau"
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <a href={document.fileUrl} download title="Herunterladen">
                      <Button variant="ghost" size="icon" aria-label={`${document.name} herunterladen`}>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </a>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(documentId)}
                  aria-label={`${document.name} entfernen`}
                  title="Von Bewerbung trennen"
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="attach-doc" className="mb-1.5 block text-sm font-medium text-foreground">
            Vorhandenes Dokument anhängen
          </label>
          <Select id="attach-doc" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Dokument auswählen …</option>
            {available.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" variant="secondary" onClick={handleAttach} disabled={!selected || attaching}>
          <Plus className="h-4 w-4" /> Anhängen
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Neue Dokumente lassen sich unter{" "}
        <Link href="/settings" className="text-primary hover:underline">
          Einstellungen → Dokumente
        </Link>{" "}
        hochladen.
      </p>

      {/* In-App Vorschau */}
      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
}
