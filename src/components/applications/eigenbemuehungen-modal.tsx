"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { FileText, Printer, Calendar, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { fetcher } from "@/lib/core/api";
import type { ApplicationListItem, PreferencesPublic } from "@/types";
import {
  filterApplicationsByPeriod,
  generateEigenbemuehungenHtml,
} from "@/lib/applications/eigenbemuehungenReport";

export function EigenbemuehungenModal({
  open,
  onClose,
  applications,
}: {
  open: boolean;
  onClose: () => void;
  applications: ApplicationListItem[];
}) {
  const { data: preferences } = useSWR<PreferencesPublic>("/api/preferences", fetcher);

  // Default: aktueller Monat YYYY-MM
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [customerId, setCustomerId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("career_agentur_customer_id") || "";
    }
    return "";
  });

  const { filtered, periodLabel } = useMemo(() => {
    if (!selectedMonth) {
      return { filtered: applications, periodLabel: "Gesamter Zeitraum" };
    }
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const monthName = start.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    const matches = filterApplicationsByPeriod(applications, start, end);

    return { filtered: matches, periodLabel: monthName };
  }, [selectedMonth, applications]);

  function handleSaveCustomerId(val: string) {
    setCustomerId(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("career_agentur_customer_id", val);
    }
  }

  function handlePrint() {
    const address = [preferences?.street, [preferences?.postalCode, preferences?.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");

    const html = generateEigenbemuehungenHtml({
      candidateName: preferences?.fullName || "Bewerber/in",
      candidateAddress: address || null,
      candidateEmail: preferences?.email || null,
      candidatePhone: preferences?.phone || null,
      customerId: customerId.trim() || null,
      periodLabel,
      applications: filtered,
    });

    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 250);
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">
                Nachweis von Eigenbemühungen (§ 38 / § 159 SGB III)
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Amtlicher DIN A4 Nachweis für Arbeitsagentur oder Jobcenter.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Monat auswählen:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <User className="h-3.5 w-3.5 text-primary" /> Kundennummer / BG-Nr.:
              </label>
              <Input
                placeholder="z. B. 123A456789"
                value={customerId}
                onChange={(e) => handleSaveCustomerId(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-hover/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Bewerbungs-Übersicht ({periodLabel}):</span>
              <span className="text-primary font-bold">{filtered.length} erfasste Aktivitäten</span>
            </div>

            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                In diesem Monat wurden keine Bewerbungen mit Datum erfasst.
              </p>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-border/60 text-xs">
                {filtered.map((app) => (
                  <li key={app.id} className="py-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-foreground truncate block">{app.company.name}</span>
                      <span className="text-[11px] text-muted-foreground truncate block">{app.position}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(app.applicationDate!).toLocaleDateString("de-DE")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={onClose}>
              Schließen
            </Button>
            <Button size="sm" onClick={handlePrint} disabled={filtered.length === 0}>
              <Printer className="h-4 w-4 mr-1.5" /> Drucken / PDF speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
