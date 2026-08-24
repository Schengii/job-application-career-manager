"use client";

// -----------------------------------------------------------------------------
// Excel-Tabelle / Grid-Schnellerfassung
// -----------------------------------------------------------------------------
import { ExcelGridTable } from "@/components/excel/excel-grid-table";

export default function ExcelViewPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Excel-Tabelle & Schnellerfassung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bewerbungen tabellarisch im Excel-Stil verwalten, inline bearbeiten und neue Einträge blitzschnell erfassen.
        </p>
      </header>

      <ExcelGridTable />
    </div>
  );
}
