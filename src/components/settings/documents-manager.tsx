"use client";

import { useRef, useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import { FileText, Trash2, Upload, Download, Eye, Star } from "lucide-react";
import { fetcher, apiUpload, apiDelete, apiPatch } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_CATEGORIES, findStatusMeta } from "@/lib/core/constants";
import type { Document } from "@/types";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

export function DocumentsManager() {
  const { data: documents } = useSWR<Document[]>("/api/documents", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0].value as string);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Bitte eine Datei auswählen.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name || file.name);
      formData.append("category", category);
      await apiUpload("/api/documents/upload", formData);
      await mutate("/api/documents");
      setName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Dokument wurde hochgeladen.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleDefault(doc: Document) {
    try {
      await apiPatch(`/api/documents/${doc.id}`, { isDefault: !doc.isDefault });
      await mutate("/api/documents");
      toast.success(
        doc.isDefault
          ? `"${doc.name}" wird nicht mehr automatisch angehängt.`
          : `"${doc.name}" wird ab jetzt automatisch an neue Bewerbungen angehängt.`
      );
    } catch {
      toast.error("Konnte Standard-Dokument-Status nicht ändern.");
    }
  }

  async function handleDelete(id: string, docName: string) {
    if (!confirm(`"${docName}" wirklich löschen?`)) return;
    try {
      await apiDelete(`/api/documents/${id}`);
      await mutate("/api/documents");
      toast.success("Dokument gelöscht.");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> Dokumente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Lebenslauf, Zeugnisse (Mittlere Reife, Ausbildung Elektroniker für Betriebstechnik, Umschulung) und Projektreferenzen
          zentral verwalten. Diese Dokumente lassen sich anschließend an einzelne Bewerbungen anhängen. Als{" "}
          <strong>Standard</strong> markierte Dokumente werden beim Klick auf „Direkt bewerben&quot; (Jobsuche) automatisch an die
          neue Bewerbung angehängt — spart das manuelle Anhängen bei jeder einzelnen Bewerbung.
        </p>

        <ul className="flex flex-col gap-2">
          {documents?.map((doc) => (
            <li
              key={doc.id}
              className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                doc.isDefault ? "border-primary/30 bg-primary-soft/10" : "border-border"
              }`}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                  {doc.name}
                  {doc.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      <Star className="h-2.5 w-2.5 fill-current" /> Standard
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {findStatusMeta(DOCUMENT_CATEGORIES, doc.category)?.label ?? doc.category}
                  {doc.fileName && ` · ${doc.fileName}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleDefault(doc)}
                  aria-label={doc.isDefault ? `${doc.name} nicht mehr als Standard-Dokument verwenden` : `${doc.name} als Standard-Dokument markieren`}
                  title={doc.isDefault ? "Nicht mehr automatisch anhängen" : "Automatisch an jede neue Bewerbung anhängen"}
                >
                  <Star className={`h-4 w-4 ${doc.isDefault ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </Button>
                {doc.fileUrl && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewDoc(doc)}
                      aria-label={`${doc.name} ansehen`}
                      title="In-App Vorschau"
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${doc.name} herunterladen`}
                      title="Herunterladen"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.name)} aria-label={`${doc.name} löschen`}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </li>
          ))}
          {documents?.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Dokumente hochgeladen.</p>}
        </ul>

        {/* In-App Vorschau Modal */}
        <DocumentPreviewModal
          open={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
        />

        <form onSubmit={handleUpload} className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="min-w-[180px] flex-1">
            <Field label="Anzeigename" htmlFor="doc-name">
              <Input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Lebenslauf 2026" />
            </Field>
          </div>
          <div className="min-w-[200px] flex-1">
            <Field label="Kategorie" htmlFor="doc-category">
              <Select id="doc-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="min-w-[200px] flex-1">
            <Field label="Datei" htmlFor="doc-file">
              <input
                id="doc-file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:brightness-95"
              />
            </Field>
          </div>
          <Button type="submit" disabled={uploading}>
            <Upload className="h-4 w-4" /> {uploading ? "Lade hoch …" : "Hochladen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
