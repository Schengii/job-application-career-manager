"use client";

// -----------------------------------------------------------------------------
// In-Browser Excel / CSV Datei-Import Modal (.xlsx, .xls, .csv)
// -----------------------------------------------------------------------------
import { useState, useRef } from "react";
import { useSWRConfig } from "swr";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, X, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";

type ParsedRow = {
  companyName: string;
  position: string;
  status: "DRAFT" | "SENT" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN";
  applicationDate?: string | null;
  portal?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  nextStep?: string | null;
  nextStepDate?: string | null;
};

export function ExcelImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  function resetState() {
    setFileName(null);
    setParsedRows([]);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelected(file: File) {
    if (!file) return;
    setFileName(file.name);
    setErrorMsg(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (rawRows.length < 2) {
          setErrorMsg("Die Datei enthält keine Datenzeilen.");
          setParsing(false);
          return;
        }

        // Header Zeile analysieren (Zeile 0)
        const header = (rawRows[0] as unknown[]).map((h) => String(h || "").trim().toLowerCase());

        // Header Spalten-Indizes finden
        let compIdx = header.findIndex((h) => h.includes("unternehmen") || h.includes("firma") || h.includes("company"));
        let posIdx = header.findIndex((h) => h.includes("stelle") || h.includes("position") || h.includes("job"));
        let portalIdx = header.findIndex((h) => h.includes("portal") || h.includes("quelle") || h.includes("source"));
        let contactIdx = header.findIndex((h) => h.includes("ansprechpartner") || h.includes("kontakt"));
        let emailIdx = header.findIndex((h) => h.includes("email") || h.includes("e-mail") || h.includes("mail"));
        let phoneIdx = header.findIndex((h) => h.includes("telefon") || h.includes("phone") || h.includes("tel"));
        let dateIdx = header.findIndex((h) => h.includes("datum") || h.includes("beworben"));
        let notesIdx = header.findIndex((h) => h.includes("notiz") || h.includes("anmerkung") || h.includes("bemerkung"));
        let rejIdx = header.findIndex((h) => h.includes("absage") || h.includes("abgelehnt"));

        // Fallback-Positionsindexierung nach Standard-Format falls keine exakten Matcher
        if (compIdx === -1) compIdx = 3;
        if (posIdx === -1) posIdx = 6;
        if (portalIdx === -1) portalIdx = 5;
        if (contactIdx === -1) contactIdx = 7;
        if (phoneIdx === -1) phoneIdx = 9;
        if (emailIdx === -1) emailIdx = 10;
        if (dateIdx === -1) dateIdx = 11;
        if (notesIdx === -1) notesIdx = 17;
        if (rejIdx === -1) rejIdx = 18;

        const results: ParsedRow[] = [];

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i] as unknown[];
          const companyName = String(row[compIdx] ?? "").trim();
          if (!companyName) continue; // Leere Zeile überspringen

          const position = String(row[posIdx] ?? "").trim() || "Frontend Entwickler";
          const portal = String(row[portalIdx] ?? "").trim() || null;
          const contactName = String(row[contactIdx] ?? "").trim() || null;
          const contactEmail = String(row[emailIdx] ?? "").trim() || null;
          const contactPhone = String(row[phoneIdx] ?? "").trim() || null;
          const notes = String(row[notesIdx] ?? "").trim() || null;
          const rejection = String(row[rejIdx] ?? "").trim();

          // Datum parsen
          let appDateStr: string | null = null;
          const rawDate = row[dateIdx];
          if (rawDate instanceof Date) {
            appDateStr = rawDate.toISOString().slice(0, 10);
          } else if (typeof rawDate === "string" && rawDate.trim()) {
            const m = rawDate.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            if (m) {
              const [, d, mo, y] = m;
              appDateStr = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
            }
          }

          let status: ParsedRow["status"] = "SENT";
          if (rejection) {
            status = "REJECTED";
          } else if (notes && /gespräch|interview|termin/i.test(notes)) {
            status = "INTERVIEW";
          }

          results.push({
            companyName,
            position,
            status,
            applicationDate: appDateStr || new Date().toISOString().slice(0, 10),
            portal,
            contactName,
            contactEmail,
            contactPhone,
            notes,
          });
        }

        if (results.length === 0) {
          setErrorMsg("Keine gültigen Bewerbungszeilen in der Tabelle gefunden.");
        } else {
          setParsedRows(results);
        }
      } catch {
        setErrorMsg("Fehler beim Lesen der Excel-Datei. Bitte prüfe das Format.");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (parsedRows.length === 0) return;
    setImporting(true);
    try {
      await apiPost("/api/applications/bulk", { rows: parsedRows });
      await Promise.all([
        mutate("/api/applications"),
        mutate("/api/metrics"),
        mutate("/api/companies"),
        mutate("/api/analytics"),
      ]);
      toast.success(`${parsedRows.length} Bewerbungen erfolgreich importiert!`);
      onImported?.();
      onClose();
      resetState();
    } catch {
      toast.error("Import in die Datenbank fehlgeschlagen.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Excel / CSV Datei importieren</h2>
              <p className="text-xs text-muted-foreground">
                Lade eine .xlsx, .xls oder .csv Bewerbungsliste direkt im Browser hoch.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelected(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary-soft/30"
                : "border-border hover:border-primary/50 hover:bg-surface-hover/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
            <UploadCloud className="h-10 w-10 text-primary mb-2 opacity-80" />
            <p className="text-sm font-semibold text-foreground">
              {fileName ? fileName : "Datei hier ablegen oder klicken zum Auswählen"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Unterstützt Microsoft Excel (.xlsx, .xls) und CSV-Dateien
            </p>
          </div>

          {parsing && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              Lese und analysiere Tabellendaten …
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-danger/30 bg-danger-soft/40 p-3 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vorschau der erkannten Zeilen */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Erkannte Bewerbungen ({parsedRows.length} Zeilen):
                </span>
                <span className="text-muted-foreground text-[11px]">Vorschau der ersten 5 Einträge</span>
              </div>

              <div className="rounded-lg border border-border overflow-hidden bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-hover/70 border-b border-border text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-1.5">Firma</th>
                      <th className="px-3 py-1.5">Position</th>
                      <th className="px-3 py-1.5">Portal</th>
                      <th className="px-3 py-1.5">Status</th>
                      <th className="px-3 py-1.5">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-surface-hover/40">
                        <td className="px-3 py-1.5 font-semibold text-foreground">{row.companyName}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.position}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.portal ?? "—"}</td>
                        <td className="px-3 py-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              row.status === "OFFER"
                                ? "bg-emerald-500/15 text-emerald-600"
                                : row.status === "REJECTED"
                                ? "bg-rose-500/15 text-rose-600"
                                : row.status === "INTERVIEW"
                                ? "bg-sky-500/15 text-sky-600"
                                : "bg-amber-500/15 text-amber-600"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.applicationDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-hover/30">
          <Button variant="outline" size="sm" onClick={onClose} disabled={importing}>
            Abbrechen
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={parsedRows.length === 0 || importing}
            className="card-hover-effect"
          >
            {importing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>{importing ? "Importiere …" : `${parsedRows.length} Zeilen importieren`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
