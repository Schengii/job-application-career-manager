"use client";

// -----------------------------------------------------------------------------
// Verwaltung der wiederverwendbaren Anschreiben-Textbausteine
// (prisma.CoverLetterSnippet, s. /api/snippets). Ergänzt Company.letterTemplate
// (auf genau einen Einleitungssatz PRO Unternehmen beschränkt) um frei
// benennbare Bausteine, die im Anschreiben-Panel per 1-Klick eingefügt werden
// können (s. cover-letter-snippet-picker.tsx).
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR from "swr";
import { BookText, Plus, Trash2, Loader2 } from "lucide-react";
import { fetcher, apiPost, apiDelete } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import type { CoverLetterSnippet } from "@/types";

export function CoverLetterSnippetsCard() {
  const { data: snippets, mutate } = useSWR<CoverLetterSnippet[]>("/api/snippets", fetcher);
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await apiPost("/api/snippets", { title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      await mutate();
      toast.success("Textbaustein angelegt.");
    } catch {
      toast.error("Textbaustein konnte nicht angelegt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiDelete(`/api/snippets/${id}`);
      await mutate();
      toast.success("Textbaustein gelöscht.");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <BookText className="h-5 w-5 text-primary" /> Anschreiben-Textbaustein-Bibliothek
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Wiederverwendbare, unternehmensunabhängige Absätze (z.B. &bdquo;Remote-Absatz&ldquo;,
          &bdquo;Standard-Schlussabsatz&ldquo;) — im Anschreiben-Panel jeder Bewerbung per 1-Klick einfügbar.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel, z.B. „Remote-Absatz“"
            aria-label="Titel des Textbausteins"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Inhalt des Textbausteins …"
            aria-label="Inhalt des Textbausteins"
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleCreate} disabled={saving || !title.trim() || !content.trim()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Baustein anlegen
            </Button>
          </div>
        </div>

        {snippets && snippets.length === 0 && (
          <p className="text-xs text-muted-foreground">Noch keine Textbausteine angelegt.</p>
        )}

        {snippets && snippets.length > 0 && (
          <div className="flex flex-col gap-2">
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-surface-hover/30 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{snippet.title}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{snippet.content}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-rose-500 hover:bg-rose-500/10"
                  onClick={() => handleDelete(snippet.id)}
                  disabled={deletingId === snippet.id}
                  title="Textbaustein löschen"
                >
                  {deletingId === snippet.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
