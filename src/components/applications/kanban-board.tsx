"use client";

// -----------------------------------------------------------------------------
// Kanban-Board für Bewerbungen mit klaren Farbakzenten
// -----------------------------------------------------------------------------
import { useState } from "react";
import Link from "next/link";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import type { ApplicationListItem } from "@/types";

const COLUMN_COLORS: Record<string, { header: string; dot: string; cardBorder: string }> = {
  DRAFT: {
    header: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
    cardBorder: "border-l-4 border-l-slate-400",
  },
  SENT: {
    header: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    cardBorder: "border-l-4 border-l-amber-500",
  },
  INTERVIEW: {
    header: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    cardBorder: "border-l-4 border-l-sky-500",
  },
  OFFER: {
    header: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    cardBorder: "border-l-4 border-l-emerald-500",
  },
  REJECTED: {
    header: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    cardBorder: "border-l-4 border-l-rose-500",
  },
  WITHDRAWN: {
    header: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
    cardBorder: "border-l-4 border-l-gray-400",
  },
};

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
    <div className="scroll-thin flex gap-4 overflow-x-auto pb-4">
      {APPLICATION_STATUSES.map((col) => {
        const items = applications.filter((a) => a.status === col.value);
        const colStyle = COLUMN_COLORS[col.value] || COLUMN_COLORS.DRAFT;

        return (
          <div
            key={col.value}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-surface-hover/30 transition-colors shadow-2xs",
              dragOverStatus === col.value && "border-primary bg-primary-soft/40 ring-2 ring-primary/30"
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
            {/* Spaltenkopf */}
            <div className={cn("flex items-center justify-between border-b border-border px-3.5 py-2.5 rounded-t-xl", colStyle.header)}>
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", colStyle.dot)} />
                <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
              </div>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-foreground shadow-2xs">
                {items.length}
              </span>
            </div>

            {/* Karten-Liste */}
            <div className="flex min-h-[140px] flex-col gap-2.5 p-2.5">
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
                    "block cursor-grab rounded-lg border border-border bg-surface p-3.5 shadow-2xs transition-all card-hover-effect active:cursor-grabbing",
                    colStyle.cardBorder,
                    dragId === app.id && "opacity-40 scale-95"
                  )}
                >
                  <p className="truncate text-sm font-semibold text-foreground">{app.company.name}</p>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{app.position}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-1.5">
                    <span>{formatDate(app.applicationDate)}</span>
                    {(app.source || app.jobPosting?.portalSource) && (
                      <span className="truncate max-w-[100px] text-[10px] bg-surface-hover px-1.5 py-0.5 rounded font-medium">
                        {app.source || app.jobPosting?.portalSource}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground/60">
                  Keine Bewerbungen
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
