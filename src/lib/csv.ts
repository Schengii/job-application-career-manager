// -----------------------------------------------------------------------------
// CSV-Export für die Bewerbungsübersicht (Excel-kompatibel, UTF-8 mit BOM).
// -----------------------------------------------------------------------------
import { findStatusMeta, APPLICATION_STATUSES } from "./constants";
import { formatDate } from "./utils";
import type { ApplicationListItem } from "@/types";

function escapeCsvField(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function applicationsToCsv(applications: ApplicationListItem[]): string {
  const header = ["Firma", "Position", "Status", "Bewerbungsdatum", "Nächster Schritt", "Quelle", "Notizen"];
  const rows = applications.map((a) => [
    a.company.name,
    a.position,
    findStatusMeta(APPLICATION_STATUSES, a.status)?.label ?? a.status,
    formatDate(a.applicationDate),
    a.nextStep ?? "",
    a.source ?? "",
    (a.notes ?? "").replace(/\r?\n/g, " "),
  ]);

  const lines = [header, ...rows].map((row) => row.map((cell) => escapeCsvField(String(cell))).join(";"));
  return lines.join("\r\n");
}

/** Löst im Browser einen Datei-Download für den übergebenen CSV-Inhalt aus. */
export function downloadCsv(filename: string, csvContent: string) {
  // UTF-8 BOM, damit Excel Umlaute (ä/ö/ü) korrekt anzeigt
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
