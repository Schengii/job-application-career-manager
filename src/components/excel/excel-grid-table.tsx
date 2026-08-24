"use client";

// -----------------------------------------------------------------------------
// Interaktive Excel-Tabelle / Grid-Editor für Bewerbungen
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import {
  Plus,
  Save,
  Download,
  Trash2,
  ArrowUpRight,
  Search,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { fetcher, apiPost, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/constants";
import type { ApplicationListItem } from "@/types";
import { applicationsToCsv, downloadCsv } from "@/lib/csv";

export type ExcelRow = {
  id: string;
  companyName: string;
  position: string;
  status: string;
  applicationDate: string; // YYYY-MM-DD
  portal: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  nextStep: string;
  nextStepDate: string;
  notes: string;
  isDirty?: boolean;
};

export function ExcelGridTable() {
  const { data: applications, isLoading } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);

  if (isLoading || !applications) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
        Lade Excel-Tabelle …
      </div>
    );
  }

  return <ExcelGridContent initialApplications={applications} />;
}

function ExcelGridContent({ initialApplications }: { initialApplications: ApplicationListItem[] }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [rows, setRows] = useState<ExcelRow[]>(() =>
    initialApplications.map((app) => ({
      id: app.id,
      companyName: app.company.name,
      position: app.position,
      status: app.status,
      applicationDate: app.applicationDate ? new Date(app.applicationDate).toISOString().slice(0, 10) : "",
      portal: app.source || app.jobPosting?.portalSource || "",
      contactName: app.company.contactName || "",
      contactEmail: app.company.contactEmail || "",
      contactPhone: app.company.contactPhone || "",
      nextStep: app.nextStep || "",
      nextStepDate: app.nextStepDate ? new Date(app.nextStepDate).toISOString().slice(0, 10) : "",
      notes: app.notes || "",
      isDirty: false,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.companyName.toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q) ||
        r.portal.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  function handleCellChange(id: string, field: keyof ExcelRow, value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value, isDirty: true };
        }
        return r;
      })
    );
    setSaveStatus("IDLE");
  }

  function handleAddRow() {
    const newId = `temp-${Date.now()}`;
    const newRow: ExcelRow = {
      id: newId,
      companyName: "",
      position: "Frontend Entwickler",
      status: "DRAFT",
      applicationDate: new Date().toISOString().slice(0, 10),
      portal: "Stepstone",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      nextStep: "",
      nextStepDate: "",
      notes: "",
      isDirty: true,
    };
    setRows([newRow, ...rows]);
  }

  async function handleSaveAll() {
    const dirtyRows = rows.filter((r) => r.isDirty && r.companyName.trim());
    if (dirtyRows.length === 0) {
      toast.success("Alle Daten sind bereits auf dem neuesten Stand.");
      return;
    }

    setSaving(true);
    setSaveStatus("SAVING");
    try {
      await apiPost("/api/applications/bulk", { rows: dirtyRows });
      setRows((prev) => prev.map((r) => ({ ...r, isDirty: false })));
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics"), mutate("/api/companies")]);
      setSaveStatus("SAVED");
      toast.success(`${dirtyRows.length} Zeile(n) erfolgreich gespeichert!`);
    } catch {
      toast.error("Fehler beim Speichern der Excel-Tabelle.");
      setSaveStatus("IDLE");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRow(row: ExcelRow) {
    if (row.id.startsWith("temp-")) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }

    if (!confirm(`Möchtest du die Bewerbung bei "${row.companyName}" wirklich löschen?`)) return;

    try {
      await apiDelete(`/api/applications/${row.id}`);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
      toast.success("Bewerbung gelöscht.");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  }

  function handleExportCsv() {
    if (!initialApplications?.length) return;
    downloadCsv(`bewerbungsliste-excel-${new Date().toISOString().slice(0, 10)}.csv`, applicationsToCsv(initialApplications));
    toast.success("Tabelle als CSV/Excel exportiert.");
  }

  const dirtyCount = rows.filter((r) => r.isDirty).length;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Tabellen-Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-border glass-card">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Tabellen-Schnellerfassung
              {dirtyCount > 0 && (
                <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning animate-pulse-subtle">
                  {dirtyCount} ungespeichert
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Direkt wie in Excel Zellen bearbeiten, Tab/Enter zur Navigation nutzen.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tabelle durchsuchen …"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
            />
          </div>

          <Button size="sm" variant="outline" onClick={handleAddRow}>
            <Plus className="h-4 w-4" /> Neue Zeile
          </Button>

          <Button size="sm" variant="outline" onClick={handleExportCsv}>
            <Download className="h-4 w-4" /> Export
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={saving || dirtyCount === 0}
            className="relative"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : saveStatus === "SAVED" ? (
              <CheckCircle2 className="h-4 w-4 text-success-foreground" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "Speichere …" : saveStatus === "SAVED" ? "Gespeichert" : "Speichern"}</span>
          </Button>
        </div>
      </div>

      {/* Grid-Tabelle */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="scroll-thin overflow-x-auto max-h-[70vh]">
          <table className="w-full min-w-[1200px] text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 border-b border-border bg-surface-hover/90 backdrop-blur-md text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="w-10 px-3 py-2.5 text-center">#</th>
                <th className="w-48 px-3 py-2.5">Unternehmen *</th>
                <th className="w-48 px-3 py-2.5">Position *</th>
                <th className="w-32 px-3 py-2.5">Datum</th>
                <th className="w-36 px-3 py-2.5">Portal</th>
                <th className="w-36 px-3 py-2.5">Status</th>
                <th className="w-40 px-3 py-2.5">Ansprechpartner</th>
                <th className="w-44 px-3 py-2.5">E-Mail / Tel</th>
                <th className="w-36 px-3 py-2.5">Wiedervorlage</th>
                <th className="min-w-[200px] px-3 py-2.5">Notizen / Anmerkungen</th>
                <th className="w-16 px-3 py-2.5 text-center">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    Keine Zeilen gefunden. Klicke auf „+ Neue Zeile“, um eine Bewerbung einzutragen.
                  </td>
                </tr>
              )}
              {filteredRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`group hover:bg-surface-hover/40 transition-colors ${
                    row.isDirty ? "bg-warning-soft/20" : ""
                  }`}
                >
                  <td className="px-3 py-1.5 text-center text-muted-foreground font-mono text-[10px]">
                    {idx + 1}
                  </td>

                  {/* Unternehmen */}
                  <td className="p-1 excel-cell">
                    <input
                      type="text"
                      value={row.companyName}
                      placeholder="Firma Name..."
                      onChange={(e) => handleCellChange(row.id, "companyName", e.target.value)}
                      className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Position */}
                  <td className="p-1 excel-cell">
                    <input
                      type="text"
                      value={row.position}
                      placeholder="Frontend Entwickler..."
                      onChange={(e) => handleCellChange(row.id, "position", e.target.value)}
                      className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Datum */}
                  <td className="p-1 excel-cell">
                    <input
                      type="date"
                      value={row.applicationDate}
                      onChange={(e) => handleCellChange(row.id, "applicationDate", e.target.value)}
                      className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Portal */}
                  <td className="p-1 excel-cell">
                    <select
                      value={row.portal}
                      onChange={(e) => handleCellChange(row.id, "portal", e.target.value)}
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

                  {/* Status */}
                  <td className="p-1 excel-cell">
                    <select
                      value={row.status}
                      onChange={(e) => handleCellChange(row.id, "status", e.target.value)}
                      className="w-full rounded px-1.5 py-1 bg-transparent text-xs font-semibold focus:outline-none focus:bg-surface"
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Ansprechpartner */}
                  <td className="p-1 excel-cell">
                    <input
                      type="text"
                      value={row.contactName}
                      placeholder="z. B. Fr. Müller"
                      onChange={(e) => handleCellChange(row.id, "contactName", e.target.value)}
                      className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Kontakt E-Mail / Tel */}
                  <td className="p-1 excel-cell">
                    <input
                      type="text"
                      value={row.contactEmail || row.contactPhone}
                      placeholder="kontakt@firma.de"
                      onChange={(e) => handleCellChange(row.id, "contactEmail", e.target.value)}
                      className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Wiedervorlage / Datum */}
                  <td className="p-1 excel-cell">
                    <input
                      type="date"
                      value={row.nextStepDate}
                      onChange={(e) => handleCellChange(row.id, "nextStepDate", e.target.value)}
                      className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Notizen */}
                  <td className="p-1 excel-cell">
                    <input
                      type="text"
                      value={row.notes}
                      placeholder="Notizen zur Bewerbung …"
                      onChange={(e) => handleCellChange(row.id, "notes", e.target.value)}
                      className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Aktionen */}
                  <td className="p-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {!row.id.startsWith("temp-") && (
                        <Link href={`/applications/${row.id}`} title="Zur Detailansicht">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRow(row)}
                        className="h-6 w-6 text-danger hover:bg-danger-soft"
                        title="Zeile entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
