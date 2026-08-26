import { useState } from "react";
import { useSWRConfig } from "swr";
import {
  Trash2,
  Download,
  X,
  ChevronDown,
  Tag,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";
import { APPLICATION_STATUSES, REJECTION_REASONS } from "@/lib/constants";
import type { ApplicationListItem } from "@/types";
import { applicationsToCsv, downloadCsv } from "@/lib/csv";

export function BatchActionBar({
  selectedIds,
  applications,
  onClearSelection,
}: {
  selectedIds: string[];
  applications: ApplicationListItem[];
  onClearSelection: () => void;
}) {
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>(REJECTION_REASONS[0]);
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) return null;

  async function handleBatchStatus(status: string, reason?: string) {
    setLoading(true);
    try {
      await apiPost("/api/applications/bulk", {
        action: "SET_STATUS",
        applicationIds: selectedIds,
        status,
        rejectionReason: status === "REJECTED" ? reason || rejectionReason : undefined,
      });

      await Promise.all([mutate("/api/applications"), mutate("/api/metrics"), mutate("/api/analytics")]);
      toast.success(`Status für ${selectedIds.length} Bewerbung(en) auf ${status} geändert.`);
      setStatusMenuOpen(false);
      setRejectModalOpen(false);
      onClearSelection();
    } catch {
      toast.error("Stapel-Aktualisierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchDelete() {
    if (!confirm(`${selectedIds.length} ausgewählte Bewerbung(en) wirklich unwiderruflich löschen?`)) {
      return;
    }

    setLoading(true);
    try {
      await apiPost("/api/applications/bulk", {
        action: "DELETE",
        applicationIds: selectedIds,
      });

      await Promise.all([mutate("/api/applications"), mutate("/api/metrics"), mutate("/api/analytics")]);
      toast.success(`${selectedIds.length} Bewerbung(en) gelöscht.`);
      onClearSelection();
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTag() {
    if (!newTag.trim()) return;
    setLoading(true);
    try {
      await apiPost("/api/applications/bulk", {
        action: "ADD_TAG",
        applicationIds: selectedIds,
        tag: newTag.trim(),
      });

      await mutate("/api/applications");
      toast.success(`Tag #${newTag.trim()} zu ${selectedIds.length} Bewerbung(en) hinzugefügt.`);
      setNewTag("");
      setTagInputOpen(false);
    } catch {
      toast.error("Tag konnte nicht hinzugefügt werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyStandardPackage() {
    setLoading(true);
    try {
      const result = await apiPost<{ documentsAttached: number; coverLettersGenerated: number }>(
        "/api/applications/bulk",
        { action: "APPLY_STANDARD_PACKAGE", applicationIds: selectedIds }
      );

      await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
      toast.success(
        `Standard-Paket angewendet: ${result.documentsAttached} Dokument(e) angehängt, ${result.coverLettersGenerated} Anschreiben generiert.`
      );
      onClearSelection();
    } catch {
      toast.error("Standard-Paket konnte nicht angewendet werden.");
    } finally {
      setLoading(false);
    }
  }

  function handleExportSelectedCsv() {
    const selectedApps = applications.filter((a) => selectedIds.includes(a.id));
    if (selectedApps.length === 0) return;
    downloadCsv(
      `bewerbungen-auswahl-${new Date().toISOString().slice(0, 10)}.csv`,
      applicationsToCsv(selectedApps)
    );
    toast.success(`${selectedApps.length} Bewerbung(en) als CSV exportiert.`);
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-surface/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 border-r border-border pr-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-foreground">ausgewählt</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Dropdown Trigger */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                disabled={loading}
                className="h-8 text-xs"
              >
                <span>Status ändern</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>

              {statusMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl">
                  {APPLICATION_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        if (s.value === "REJECTED") {
                          setStatusMenuOpen(false);
                          setRejectModalOpen(true);
                        } else {
                          handleBatchStatus(s.value);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium hover:bg-surface-hover transition-colors"
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tag Hinzufügen Trigger */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTagInputOpen(!tagInputOpen)}
                disabled={loading}
                className="h-8 text-xs"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Tag</span>
              </Button>

              {tagInputOpen && (
                <div className="absolute bottom-full left-0 mb-2 flex w-56 items-center gap-1.5 rounded-xl border border-border bg-surface p-2 shadow-xl">
                  <input
                    type="text"
                    placeholder="z.B. Prio1, Remote …"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    className="h-7 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddTag} className="h-7 px-2 text-xs">
                    +
                  </Button>
                </div>
              )}
            </div>

            {/* Standard-Bewerbungspaket nachträglich anwenden */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleApplyStandardPackage}
              disabled={loading}
              className="h-8 text-xs"
              title="Standard-Dokumente anhängen & fehlendes Anschreiben generieren"
            >
              <PackageCheck className="h-3.5 w-3.5 text-primary" />
              <span>Standard-Paket</span>
            </Button>

            {/* CSV Export */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportSelectedCsv}
              disabled={loading}
              className="h-8 text-xs"
              title="Ausgewählte als CSV exportieren"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </Button>

            {/* Batch Delete */}
            <Button
              size="sm"
              variant="danger"
              onClick={handleBatchDelete}
              disabled={loading}
              className="h-8 text-xs"
              title="Ausgewählte löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={onClearSelection}
              className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
              title="Auswahl aufheben"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal for Batch */}
      {rejectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRejectModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground">
              Absagegrund für {selectedIds.length} Bewerbung(en) erfassen
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ein strukturierter Absagegrund hilft bei der Ursachenanalyse unter Auswertungen.
            </p>

            <div className="mt-3 space-y-2">
              <label className="text-xs font-semibold text-foreground">Grund wählen:</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
                Abbrechen
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleBatchStatus("REJECTED", rejectionReason)}
                disabled={loading}
              >
                Als Absage markieren
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
