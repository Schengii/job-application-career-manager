"use client";

// -----------------------------------------------------------------------------
// Anschreiben-Textbaustein-Bibliothek: 1-Klick-Einfügen wiederverwendbarer,
// unternehmensunabhängiger Absätze (z.B. "Standard-Schlussabsatz",
// "Remote-Absatz") ins aktuelle Anschreiben. Verwaltet werden die Bausteine
// selbst in den Einstellungen (siehe settings/cover-letter-snippets-card.tsx);
// dieses Widget im Anschreiben-Panel liest sie nur und fügt sie ein.
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR from "swr";
import { BookText, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { fetcher } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { CoverLetterSnippet } from "@/types";

export function CoverLetterSnippetPicker({ onInsert }: { onInsert: (content: string) => void }) {
  const { data: snippets } = useSWR<CoverLetterSnippet[]>("/api/snippets", fetcher);
  const [expanded, setExpanded] = useState(false);

  if (!snippets || snippets.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-hover/30 p-4 space-y-2 animate-fade-in">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <BookText className="h-4 w-4 text-primary" />
          Textbaustein-Bibliothek ({snippets.length})
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5 pt-1">
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{snippet.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{snippet.content}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onInsert(snippet.content)}
                title="In das Anschreiben einfügen"
              >
                <Plus className="h-3.5 w-3.5" /> Einfügen
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
