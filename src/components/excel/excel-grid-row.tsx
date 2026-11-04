"use client";

// -----------------------------------------------------------------------------
// Tabellenkopf und editierbare Tabellenzeile der Excel-Ansicht.
// Ausgelagert aus excel-grid-table.tsx.
// -----------------------------------------------------------------------------
import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/core/constants";
import { cn } from "@/lib/core/utils";
import type { ExcelRow, VisibleColumns } from "@/lib/applications/excelGrid";

export function ExcelGridHead({ visibleCols }: { visibleCols: VisibleColumns }) {
  return (
    <thead className="sticky top-0 z-20 border-b border-border bg-surface-hover/90 backdrop-blur-md text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
      <tr>
        <th className="w-10 px-3 py-2.5 text-center">#</th>
        <th className="w-48 px-3 py-2.5">Unternehmen *</th>
        <th className="w-48 px-3 py-2.5">Position *</th>
        {visibleCols.date && <th className="w-32 px-3 py-2.5">Datum</th>}
        {visibleCols.portal && <th className="w-36 px-3 py-2.5">Portal</th>}
        {visibleCols.status && <th className="w-36 px-3 py-2.5">Status</th>}
        {visibleCols.contact && <th className="w-40 px-3 py-2.5">Ansprechpartner</th>}
        {visibleCols.email && <th className="w-44 px-3 py-2.5">E-Mail / Tel</th>}
        {visibleCols.followUp && <th className="w-36 px-3 py-2.5">Wiedervorlage</th>}
        {visibleCols.notes && <th className="min-w-[200px] px-3 py-2.5">Notizen / Anmerkungen</th>}
        {visibleCols.actions && <th className="w-16 px-3 py-2.5 text-center">Aktion</th>}
      </tr>
    </thead>
  );
}

type RowProps = {
  row: ExcelRow;
  /** 0-basierter Index in der angezeigten Liste. */
  index: number;
  visibleCols: VisibleColumns;
  onCellChange: (id: string, field: keyof ExcelRow, value: string) => void;
  onDelete: (row: ExcelRow) => void;
};

export function ExcelGridRow({ row, index, visibleCols, onCellChange, onDelete }: RowProps) {
  return (
    <tr
      className={cn(
        "group hover:bg-surface-hover/50 transition-colors",
        row.isDirty && "bg-warning-soft/30",
        row.status === "SENT" && "border-l-4 border-l-amber-500",
        row.status === "INTERVIEW" && "border-l-4 border-l-sky-500",
        row.status === "OFFER" && "border-l-4 border-l-emerald-500",
        row.status === "REJECTED" && "border-l-4 border-l-rose-500",
        row.status === "WITHDRAWN" && "border-l-4 border-l-slate-400",
        row.status === "DRAFT" && "border-l-4 border-l-slate-300"
      )}
    >
      <td className="px-3 py-1.5 text-center text-muted-foreground font-mono text-[10px]">
        {index + 1}
      </td>

      {/* Unternehmen */}
      <td className="p-1 excel-cell">
        <input
          type="text"
          value={row.companyName}
          placeholder="Firma Name..."
          onChange={(e) => onCellChange(row.id, "companyName", e.target.value)}
          className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
        />
      </td>

      {/* Position */}
      <td className="p-1 excel-cell">
        <input
          type="text"
          value={row.position}
          placeholder="Frontend Entwickler..."
          onChange={(e) => onCellChange(row.id, "position", e.target.value)}
          className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
        />
      </td>

      {/* Datum */}
      {visibleCols.date && (
        <td className="p-1 excel-cell">
          <input
            type="date"
            value={row.applicationDate}
            onChange={(e) => onCellChange(row.id, "applicationDate", e.target.value)}
            className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
          />
        </td>
      )}

      {/* Portal */}
      {visibleCols.portal && (
        <td className="p-1 excel-cell">
          <select
            value={row.portal}
            onChange={(e) => onCellChange(row.id, "portal", e.target.value)}
            className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
          >
            <option value="">(Kein Portal)</option>
            {JOB_PORTALS.map((p) => (
              <option key={p.value} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </td>
      )}

      {/* Status */}
      {visibleCols.status && (
        <td className="p-1 excel-cell">
          <select
            value={row.status}
            onChange={(e) => onCellChange(row.id, "status", e.target.value)}
            className={cn(
              "w-full rounded px-2 py-1 text-xs font-bold focus:outline-none focus:bg-surface border border-current/20",
              row.status === "SENT" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
              row.status === "INTERVIEW" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
              row.status === "OFFER" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
              row.status === "REJECTED" && "bg-rose-500/15 text-rose-700 dark:text-rose-300",
              row.status === "WITHDRAWN" && "bg-gray-500/15 text-gray-700 dark:text-gray-300",
              row.status === "DRAFT" && "bg-slate-500/15 text-slate-700 dark:text-slate-300"
            )}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-surface text-foreground font-normal">
                {s.label}
              </option>
            ))}
          </select>
        </td>
      )}

      {/* Ansprechpartner */}
      {visibleCols.contact && (
        <td className="p-1 excel-cell">
          <input
            type="text"
            value={row.contactName}
            placeholder="z. B. Fr. Müller"
            onChange={(e) => onCellChange(row.id, "contactName", e.target.value)}
            className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
          />
        </td>
      )}

      {/* Kontakt E-Mail / Tel */}
      {visibleCols.email && (
        <td className="p-1 excel-cell">
          <input
            type="text"
            value={row.contactEmail || row.contactPhone}
            placeholder="kontakt@firma.de"
            onChange={(e) => onCellChange(row.id, "contactEmail", e.target.value)}
            className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
          />
        </td>
      )}

      {/* Wiedervorlage / Datum */}
      {visibleCols.followUp && (
        <td className="p-1 excel-cell">
          <input
            type="date"
            value={row.nextStepDate}
            onChange={(e) => onCellChange(row.id, "nextStepDate", e.target.value)}
            className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
          />
        </td>
      )}

      {/* Notizen */}
      {visibleCols.notes && (
        <td className="p-1 excel-cell">
          <input
            type="text"
            value={row.notes}
            placeholder="Notizen zur Bewerbung …"
            onChange={(e) => onCellChange(row.id, "notes", e.target.value)}
            className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
          />
        </td>
      )}

      {/* Aktionen */}
      {visibleCols.actions && (
        <td className="p-1 text-center">
          <div className="flex items-center justify-center gap-1">
            {!row.id.startsWith("temp-") && (
              <Link href={`/applications/${row.id}`} title="Zur Detailansicht">
                <Button variant="ghost" size="icon" aria-label="Zur Detailansicht" className="h-6 w-6">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(row)}
              className="h-6 w-6 text-danger hover:bg-danger-soft"
              title="Zeile entfernen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}
