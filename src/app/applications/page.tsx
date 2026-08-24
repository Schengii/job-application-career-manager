"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { Plus, ArrowUpRight, Table2, LayoutGrid, Download, Mail, FileSpreadsheet } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { formatDate, cn } from "@/lib/utils";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { ApplicationFormDialog, quickUpdateStatus } from "@/components/applications/application-form-dialog";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { useToast } from "@/components/ui/toast";
import { applicationsToCsv, downloadCsv } from "@/lib/csv";
import { EmailResponseModal } from "@/components/applications/email-response-modal";
import { ExcelGridTable } from "@/components/excel/excel-grid-table";

type ViewMode = "table" | "kanban" | "excel";

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("table");

  const filtered = useMemo(() => {
    if (!applications) return [];
    if (statusFilter === "ALL") return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  async function handleStatusChange(id: string, status: string) {
    // Optimistisches Update: Tabelle reagiert sofort, DB wird im Hintergrund aktualisiert.
    await mutate(
      "/api/applications",
      (current: ApplicationListItem[] | undefined) =>
        current?.map((a) => (a.id === id ? { ...a, status } : a)),
      { revalidate: false },
    );
    try {
      await quickUpdateStatus(id, status);
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
      toast.success("Status aktualisiert.");
    } catch {
      toast.error("Status konnte nicht aktualisiert werden.");
      mutate("/api/applications");
    }
  }

  function handleExport() {
    if (!filtered.length) {
      toast.error("Keine Bewerbungen zum Exportieren vorhanden.");
      return;
    }
    downloadCsv(`bewerbungen-${new Date().toISOString().slice(0, 10)}.csv`, applicationsToCsv(filtered));
    toast.success("CSV-Export wurde heruntergeladen.");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bewerbungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Alle Bewerbungen im Überblick, mit direktem Status-Update.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEmailModalOpen(true)}>
            <Mail className="h-4 w-4" /> E-Mail erfassen
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> CSV-Export
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Neue Bewerbung
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Nach Status filtern">
          <FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
            Alle ({applications?.length ?? 0})
          </FilterChip>
          {APPLICATION_STATUSES.map((s) => (
            <FilterChip key={s.value} active={statusFilter === s.value} onClick={() => setStatusFilter(s.value)}>
              {s.label} ({applications?.filter((a) => a.status === s.value).length ?? 0})
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1" role="tablist" aria-label="Ansicht wählen">
          <button
            type="button"
            role="tab"
            aria-selected={view === "table"}
            onClick={() => setView("table")}
            aria-label="Tabellenansicht"
            className={cn("flex h-7 w-7 items-center justify-center rounded-md", view === "table" ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Table2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "kanban"}
            onClick={() => setView("kanban")}
            aria-label="Kanban-Ansicht"
            className={cn("flex h-7 w-7 items-center justify-center rounded-md", view === "kanban" ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "excel"}
            onClick={() => setView("excel")}
            aria-label="Excel-Tabellenansicht"
            className={cn("flex h-7 w-7 items-center justify-center rounded-md", view === "excel" ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <FileSpreadsheet className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "excel" ? (
        <ExcelGridTable />
      ) : view === "kanban" ? (
        isLoading ? (
          <p className="text-sm text-muted-foreground">Lade Bewerbungen …</p>
        ) : (
          <KanbanBoard applications={filtered} onStatusChange={handleStatusChange} />
        )
      ) : (
      <Card className="overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface-hover/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Firma</th>
                <th className="px-5 py-3 font-medium">Position</th>
                <th className="px-5 py-3 font-medium">Datum</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Nächster Schritt</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    Lade Bewerbungen …
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    Keine Bewerbungen für diesen Filter gefunden.
                  </td>
                </tr>
              )}
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-surface-hover/60">
                  <td className="px-5 py-3">
                    <Link href={`/applications/${app.id}`} className="font-medium text-foreground hover:underline">
                      {app.company.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{app.position}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(app.applicationDate)}</td>
                  <td className="px-5 py-3">
                    <label className="sr-only" htmlFor={`status-${app.id}`}>
                      Status für {app.position}
                    </label>
                    <Select
                      id={`status-${app.id}`}
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="h-8 w-auto py-1 text-xs"
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="max-w-[220px] truncate px-5 py-3 text-muted-foreground">{app.nextStep ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Details <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      <ApplicationFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <EmailResponseModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onUpdated={() => {
          mutate("/api/applications");
          mutate("/api/metrics");
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-surface text-muted-foreground hover:bg-surface-hover",
      )}
    >
      {children}
    </button>
  );
}
