"use client";

// -----------------------------------------------------------------------------
// Kanban-Board für Bewerbungen: eine Spalte je Status, Karten lassen sich per
// Drag & Drop zwischen Spalten verschieben (native HTML5 Drag-and-Drop-API,
// keine zusätzliche Abhängigkeit nötig). Ein Drop löst denselben
// Status-Update-Callback aus wie das Dropdown in der Tabellenansicht.
// -----------------------------------------------------------------------------
import { useState } from "react";
import Link from "next/link";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import type { ApplicationListItem } from "@/types";

export function KanbanBoard({
  applications,
  onStatusChange,
}: {
  applications: ApplicationListItem[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  return (
    <div className="scroll-thin flex gap-4 overflow-x-auto pb-2">
      {APPLICATION_STATUSES.map((col) => {
        const items = applications.filter((a) => a.status === col.value);
        return (
          <div
            key={col.value}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-surface-hover/40 transition-colors",
              dragOverStatus === col.value && "border-primary bg-primary-soft/40",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(col.value);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === col.value ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatus(null);
              if (dragId) onStatusChange(dragId, col.value);
              setDragId(null);
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex min-h-[100px] flex-col gap-2 p-2">
              {items.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  draggable
                  onDragStart={(e) => {
                    setDragId(app.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "block cursor-grab rounded-lg border border-border bg-surface p-3 shadow-sm transition-opacity hover:border-primary/50 active:cursor-grabbing",
                    dragId === app.id && "opacity-40",
                  )}
                >
                  <p className="truncate text-sm font-medium text-foreground">{app.company.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{app.position}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{formatDate(app.applicationDate)}</p>
                </Link>
              ))}
              {items.length === 0 && (
                <p className="px-1 py-3 text-center text-xs text-muted-foreground">Keine Bewerbungen</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
