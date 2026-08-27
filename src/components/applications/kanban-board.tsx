"use client";

// -----------------------------------------------------------------------------
// Kanban-Board für Bewerbungen mit klaren Farbakzenten
// -----------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
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

/**
 * Tastatur-/Screenreader-Alternative zum Maus-Drag&Drop: ein fokussierbarer
 * "⋮"-Button pro Karte öffnet ein Menü mit allen Zielspalten. Bewusst als
 * separates Element NEBEN dem `<Link>` (nicht darin verschachtelt) gerendert
 * — ein `<button>` innerhalb eines `<a>` wäre ungültiges/für Screenreader
 * verwirrendes HTML (verschachtelter interaktiver Inhalt).
 */
function StatusMoveMenu({
  app,
  onMove,
}: {
  app: ApplicationListItem;
  onMove: (targetStatus: string, targetLabel: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="absolute right-1.5 top-1.5" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status von ${app.company.name} ändern`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Zielspalte wählen"
          className="absolute right-0 top-7 z-20 w-48 rounded-lg border border-border bg-surface py-1 shadow-2xl animate-scale-in"
        >
          {APPLICATION_STATUSES.filter((s) => s.value !== app.status).map((s) => (
            <button
              key={s.value}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onMove(s.value, s.label);
              }}
              className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-surface-hover hover:text-primary transition-colors"
            >
              Nach „{s.label}“ verschieben
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function KanbanBoard({
  applications,
  onStatusChange,
}: {
  applications: ApplicationListItem[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  // Bestätigungstext für Screenreader-Nutzer: Maus-Drag&Drop liefert sonst
  // keinerlei Feedback für Assistive Technologien, dass sich der Status einer
  // Karte geändert hat.
  const [announcement, setAnnouncement] = useState("");

  function handleMove(app: ApplicationListItem, targetStatus: string, targetLabel: string) {
    onStatusChange(app.id, targetStatus);
    setAnnouncement(`${app.company.name} nach „${targetLabel}“ verschoben.`);
  }

  return (
    <div className="scroll-thin flex gap-4 overflow-x-auto pb-4">
      {/* aria-live-Region für die Statuswechsel-Bestätigung (Maus-DnD & Tastatur-Menü) */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

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
              const draggedApp = applications.find((a) => a.id === dragId);
              if (draggedApp) handleMove(draggedApp, col.value, col.label);
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
                <div key={app.id} className="relative">
                  <Link
                    href={`/applications/${app.id}`}
                    draggable
                    onDragStart={(e) => {
                      setDragId(app.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "block cursor-grab rounded-lg border border-border bg-surface p-3.5 pr-8 shadow-2xs transition-all card-hover-effect active:cursor-grabbing",
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
                  <StatusMoveMenu app={app} onMove={(status, label) => handleMove(app, status, label)} />
                </div>
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
