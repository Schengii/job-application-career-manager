"use client";

import { useRef, useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import { FileText, Trash2, Upload, Download } from "lucide-react";
import { fetcher, apiUpload, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_CATEGORIES, findStatusMeta } from "@/lib/constants";
import type { Document } from "@/types";

export function DocumentsManager() {
  const { data: documents } = useSWR<Document[]>("/api/documents", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0].value as string);
  const [uploading, setUploading] = useState(false);

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
          zentral verwalten. Diese Dokumente lassen sich anschließend an einzelne Bewerbungen anhängen.
        </p>

        <ul className="flex flex-col gap-2">
          {documents?.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {findStatusMeta(DOCUMENT_CATEGORIES, doc.category)?.label ?? doc.category}
                  {doc.fileName && ` · ${doc.fileName}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${doc.name} öffnen`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.name)} aria-label={`${doc.name} löschen`}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </li>
          ))}
          {documents?.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Dokumente hochgeladen.</p>}
        </ul>

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
