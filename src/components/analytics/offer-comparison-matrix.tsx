"use client";

// -----------------------------------------------------------------------------
// Gehalts- & Benefit-Vergleichsmatrix
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Plus, Trash2, Trophy, Coins, Home, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobOffer, calculateOfferScore } from "@/lib/salaryCalculator";

const DEFAULT_OFFERS: JobOffer[] = [
  {
    id: "1",
    companyName: "Tech Solutions GmbH (Beispiel A)",
    position: "Frontend Developer",
    baseSalaryAnnual: 52000,
    homeOfficeDaysPerWeek: 3,
    vacationDays: 30,
    educationBudgetAnnual: 1500,
    annualBonus: 2000,
    publicTransportCovered: true,
  },
  {
    id: "2",
    companyName: "Digital Agency Köln (Beispiel B)",
    position: "Webentwickler",
    baseSalaryAnnual: 48000,
    homeOfficeDaysPerWeek: 5,
    vacationDays: 28,
    educationBudgetAnnual: 1000,
    annualBonus: 0,
    publicTransportCovered: false,
  },
];

export function OfferComparisonMatrix() {
  const [offers, setOffers] = useState<JobOffer[]>(DEFAULT_OFFERS);
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("Frontend-Entwickler");
  const [salary, setSalary] = useState(50000);
  const [homeOffice, setHomeOffice] = useState(3);
  const [vacation, setVacation] = useState(30);

  const calculated = offers.map(calculateOfferScore);
  const maxScore = Math.max(...calculated.map((c) => c.totalCompensationScore), 0);

  function handleAdd() {
    if (!companyName.trim()) return;
    const newOffer: JobOffer = {
      id: Date.now().toString(),
      companyName,
      position,
      baseSalaryAnnual: Number(salary) || 50000,
      homeOfficeDaysPerWeek: Number(homeOffice) || 0,
      vacationDays: Number(vacation) || 30,
    };
    setOffers([...offers, newOffer]);
    setCompanyName("");
  }

  function handleRemove(id: string) {
    setOffers(offers.filter((o) => o.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" /> Gehalts- & Benefit-Vergleichsrechner
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">
          Vergleiche vorliegende Vertragsangebote oder Gehaltsvorstellungen unter Berücksichtigung von Brutto/Netto,
          Home-Office-Tagen, Urlaub und geldwerten Vorteilen.
        </p>

        {/* Vergleichstabelle */}
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-border bg-surface-hover/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Unternehmen / Rolle</th>
                <th className="px-4 py-2.5 font-medium">Gehalt (Jahr / Monat)</th>
                <th className="px-4 py-2.5 font-medium">Geschätzt Netto</th>
                <th className="px-4 py-2.5 font-medium">Home-Office / Urlaub</th>
                <th className="px-4 py-2.5 font-medium">Fahrtkostenersparnis</th>
                <th className="px-4 py-2.5 font-medium text-right">Gesamt-Score</th>
                <th className="px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {calculated.map((offer) => {
                const isBest = offer.totalCompensationScore === maxScore && calculated.length > 1;

                return (
                  <tr
                    key={offer.id}
                    className={`hover:bg-surface-hover/50 transition-colors ${
                      isBest ? "bg-success-soft/20 font-medium" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isBest && <Trophy className="h-4 w-4 text-warning shrink-0" />}
                        <div>
                          <p className="text-foreground">{offer.companyName}</p>
                          <p className="text-xs text-muted-foreground">{offer.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {offer.baseSalaryAnnual.toLocaleString("de-DE")} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~{offer.baseSalaryMonthly.toLocaleString("de-DE")} € / Mon.
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      ~{offer.estimatedNetMonthly.toLocaleString("de-DE")} € / Mon.
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Home className="h-3.5 w-3.5 text-primary" /> {offer.homeOfficeDaysPerWeek} T/Woche
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> {offer.vacationDays} Tage
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-success font-medium">
                      +{offer.estimatedCommuteSavingsAnnual.toLocaleString("de-DE")} € / Jahr
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                        {offer.totalCompensationScore} Pkt.
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(offer.id)}
                        aria-label="Angebot entfernen"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Neues Angebot hinzufügen */}
        <div className="rounded-lg border border-border p-4 bg-surface-hover/30 space-y-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-primary" /> Weiteres Angebot zum Vergleich hinzufügen
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Unternehmen</label>
              <input
                type="text"
                placeholder="Firma GmbH"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Rolle / Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Brutto-Jahresgehalt (€)</label>
              <input
                type="number"
                step="1000"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Home-Office (Tage/W.)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={homeOffice}
                onChange={(e) => setHomeOffice(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Urlaubstage</label>
              <input
                type="number"
                min="20"
                max="40"
                value={vacation}
                onChange={(e) => setVacation(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" size="sm" className="w-full" onClick={handleAdd} disabled={!companyName.trim()}>
                <Plus className="h-4 w-4" /> Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
