"use client";

import { useState } from "react";
import { Receipt, Download, Plus, Trash2, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  generateTaxReport,
  generateTaxCsvExport,
  generateTaxReportPrintHtml,
  calculateTravelCost,
  type TaxDeductibleItem,
} from "@/lib/salary/taxReportCalculator";

export function TaxExpenseReportCard() {
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [items, setItems] = useState<TaxDeductibleItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("JOB_TAX_EXPENSES");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      {
        id: "tax-1",
        category: "TRAVEL",
        date: `${currentYear}-02-14`,
        description: "Vorstellungsgespräch Fachinformatiker",
        companyName: "Adesso SE",
        distanceKm: 90,
        amount: 27,
      },
      {
        id: "tax-2",
        category: "APPLICATION_FEE",
        date: `${currentYear}-03-01`,
        description: "Bewerbungsmappe postalisch & Porto",
        amount: 8.5,
      },
      {
        id: "tax-3",
        category: "EQUIPMENT",
        date: `${currentYear}-01-20`,
        description: "Professionelle Bewerbungsfotos Fotograf",
        amount: 69,
      },
    ];
  });

  const [newItemDate, setNewItemDate] = useState(new Date().toISOString().slice(0, 10));
  const [newItemCategory, setNewItemCategory] = useState<TaxDeductibleItem["category"]>("TRAVEL");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemCompany, setNewItemCompany] = useState("");
  const [newItemDistance, setNewItemDistance] = useState<number>(0);
  const [newItemAmount, setNewItemAmount] = useState<number>(0);

  function saveItems(updated: TaxDeductibleItem[]) {
    setItems(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("JOB_TAX_EXPENSES", JSON.stringify(updated));
    }
  }

  function handleAddItem() {
    if (!newItemDesc) {
      toast.error("Bitte gib eine kurze Beschreibung an.");
      return;
    }

    const calculatedAmount =
      newItemCategory === "TRAVEL" && newItemDistance > 0
        ? calculateTravelCost(newItemDistance)
        : Number(newItemAmount) || 0;

    const created: TaxDeductibleItem = {
      id: `tax-${Date.now()}`,
      category: newItemCategory,
      date: newItemDate,
      description: newItemDesc,
      companyName: newItemCompany || undefined,
      distanceKm: newItemCategory === "TRAVEL" ? newItemDistance : undefined,
      amount: calculatedAmount,
    };

    const next = [...items, created];
    saveItems(next);
    toast.success("Werbungskosten-Eintrag hinzugefügt.");
    setNewItemDesc("");
    setNewItemCompany("");
    setNewItemDistance(0);
    setNewItemAmount(0);
  }

  function handleDelete(id: string) {
    const next = items.filter((i) => i.id !== id);
    saveItems(next);
    toast.success("Eintrag entfernt.");
  }

  const report = generateTaxReport(selectedYear, items);

  function handleExportCsv() {
    const csv = generateTaxCsvExport(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `steuerbericht-werbungskosten-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Steuerbericht (.csv) heruntergeladen!");
  }

  function handlePrintReport() {
    const html = generateTaxReportPrintHtml(report, "Alexander Schepp");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
    toast.success("Druckansicht für das Finanzamt geöffnet!");
  }

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              Steuerbericht & Bewerbungskosten (Einkommensteuererklärung)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Erfasse steuerlich absetzbare Werbungskosten (Fahrtkosten 0,30 €/km, Bewerbungspauschalen, Fotos & Zertifikate).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs h-8 w-24"
            >
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear - 2}>{currentYear - 2}</option>
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePrintReport}
              className="h-8 text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              title="Offiziellen DIN A4 Nachweis für ELSTER / Finanzamt drucken"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Finanzamt drucken
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleExportCsv} className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              CSV-Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30">
            <span className="text-[11px] text-muted-foreground block">Gesamt absetzbar</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {report.totalDeductible.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30">
            <span className="text-[11px] text-muted-foreground block">Fahrtkosten ({report.interviewTripsCount} Fahrten)</span>
            <span className="text-sm font-semibold text-foreground">
              {report.totalTravelCost.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30">
            <span className="text-[11px] text-muted-foreground block">Bewerbungspauschalen</span>
            <span className="text-sm font-semibold text-foreground">
              {report.totalApplicationFees.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-surface-hover/30">
            <span className="text-[11px] text-muted-foreground block">Fotos & Arbeitsmittel</span>
            <span className="text-sm font-semibold text-foreground">
              {report.totalOtherCost.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </span>
          </div>
        </div>

        {/* Input Form for New Expense */}
        <div className="rounded-lg border border-border/60 bg-surface-hover/20 p-3.5 space-y-3">
          <span className="text-xs font-semibold text-foreground block flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-primary" /> Neuer Kostenbeleg / Pauschale
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            <Input
              type="date"
              value={newItemDate}
              onChange={(e) => setNewItemDate(e.target.value)}
              className="text-xs h-8"
            />
            <Select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as TaxDeductibleItem["category"])}
              className="text-xs h-8"
            >
              <option value="TRAVEL">Fahrt zum Interview</option>
              <option value="APPLICATION_FEE">Bewerbungspauschale</option>
              <option value="EQUIPMENT">Bewerbungsfotos / Material</option>
              <option value="CERTIFICATION">Zertifikat / Fachliteratur</option>
            </Select>
            <Input
              placeholder="Firma (optional)"
              value={newItemCompany}
              onChange={(e) => setNewItemCompany(e.target.value)}
              className="text-xs h-8"
            />
            <Input
              placeholder="Beschreibung (z.B. Fahrt Köln)"
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              className="text-xs h-8"
            />
            {newItemCategory === "TRAVEL" ? (
              <Input
                type="number"
                placeholder="Hin+Rück km"
                value={newItemDistance || ""}
                onChange={(e) => setNewItemDistance(Number(e.target.value))}
                className="text-xs h-8"
              />
            ) : (
              <Input
                type="number"
                step="0.50"
                placeholder="Betrag in €"
                value={newItemAmount || ""}
                onChange={(e) => setNewItemAmount(Number(e.target.value))}
                className="text-xs h-8"
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleAddItem} className="h-7 text-xs">
              Eintragen
            </Button>
          </div>
        </div>

        {/* List of items */}
        {report.items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Keine Kostenbelege für das Steuerjahr {selectedYear} hinterlegt.
          </p>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-hover/50 text-muted-foreground">
                <tr>
                  <th className="py-2 px-3">Datum</th>
                  <th className="py-2 px-3">Kategorie</th>
                  <th className="py-2 px-3">Zweck / Firma</th>
                  <th className="py-2 px-3 text-right">km</th>
                  <th className="py-2 px-3 text-right">Betrag</th>
                  <th className="py-2 px-2 text-center">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {report.items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover/40">
                    <td className="py-2 px-3 text-muted-foreground">{item.date}</td>
                    <td className="py-2 px-3 font-medium">
                      {item.category === "TRAVEL"
                        ? "Fahrtkosten"
                        : item.category === "APPLICATION_FEE"
                        ? "Pauschale"
                        : "Arbeitsmittel"}
                    </td>
                    <td className="py-2 px-3 text-foreground">
                      {item.companyName ? `${item.companyName} – ` : ""}
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {item.distanceKm ? `${item.distanceKm} km` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-foreground">
                      {item.amount.toFixed(2)} €
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
