"use client";

// -----------------------------------------------------------------------------
// Gehalts- & Benefit-Vergleichsmatrix mit Decision-Scoring (Nutzenwertanalyse)
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Plus, Trash2, Trophy, Coins, Home, Calendar, Sliders, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComprehensiveJobOffer,
  DecisionCriteriaWeights,
  DEFAULT_WEIGHTS,
  scoreOffersWithWeights,
} from "@/lib/salary/offerComparison";

const DEFAULT_OFFERS: ComprehensiveJobOffer[] = [
  {
    id: "1",
    companyName: "Tech Solutions GmbH (Beispiel A)",
    position: "Frontend Developer",
    baseSalaryAnnual: 54000,
    homeOfficeDaysPerWeek: 3,
    vacationDays: 30,
    educationBudgetAnnual: 1500,
    annualBonus: 2000,
    publicTransportCovered: true,
    techStackRating: 4,
    cultureRating: 4,
    commuteMinutesOneWay: 30,
  },
  {
    id: "2",
    companyName: "Digital Agency Köln (Beispiel B)",
    position: "React & Next.js Spezialist",
    baseSalaryAnnual: 50000,
    homeOfficeDaysPerWeek: 5,
    vacationDays: 28,
    educationBudgetAnnual: 2500,
    annualBonus: 0,
    publicTransportCovered: false,
    techStackRating: 5,
    cultureRating: 5,
    commuteMinutesOneWay: 0,
  },
];

export function OfferComparisonMatrix() {
  const [offers, setOffers] = useState<ComprehensiveJobOffer[]>(DEFAULT_OFFERS);
  const [weights, setWeights] = useState<DecisionCriteriaWeights>(DEFAULT_WEIGHTS);
  const [showWeightSettings, setShowWeightSettings] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("Frontend-Entwickler");
  const [salary, setSalary] = useState(52000);
  const [homeOffice, setHomeOffice] = useState(3);
  const [vacation, setVacation] = useState(30);
  const [techRating, setTechRating] = useState(4);
  const [cultureRating, setCultureRating] = useState(4);
  const [commute, setCommute] = useState(25);

  const scoredOffers = scoreOffersWithWeights(offers, weights);

  function handleAdd() {
    if (!companyName.trim()) return;
    const newOffer: ComprehensiveJobOffer = {
      id: Date.now().toString(),
      companyName,
      position,
      baseSalaryAnnual: Number(salary) || 50000,
      homeOfficeDaysPerWeek: Number(homeOffice) || 0,
      vacationDays: Number(vacation) || 30,
      techStackRating: Number(techRating) || 4,
      cultureRating: Number(cultureRating) || 4,
      commuteMinutesOneWay: Number(commute) || 0,
    };
    setOffers([...offers, newOffer]);
    setCompanyName("");
  }

  function handleRemove(id: string) {
    setOffers(offers.filter((o) => o.id !== id));
  }

  return (
    <Card className="overflow-hidden border-border/80">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">
              Angebots-Vergleichsmatrix & Decision-Score
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Objektive Nutzenwertanalyse bei vorliegenden Vertragsangeboten mit anpassbaren Kriterien
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowWeightSettings(!showWeightSettings)}
          className="card-hover-effect text-xs"
        >
          <Sliders className="h-3.5 w-3.5 mr-1" />
          {showWeightSettings ? "Gewichtung verbergen" : "Gewichtung anpassen"}
        </Button>
      </CardHeader>

      <CardContent className="pt-2 flex flex-col gap-5">
        {/* Gewichtungs-Steuerung */}
        {showWeightSettings && (
          <div className="rounded-xl border border-primary/20 bg-primary-soft/15 p-4 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Kriterien-Gewichtung für den Decision-Score (%)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Standard wiederherstellen
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Gehalt & Bonus:</span>
                  <span className="text-primary font-bold">{weights.salaryWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.salaryWeight}
                  onChange={(e) => setWeights({ ...weights, salaryWeight: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Work-Life & Remote:</span>
                  <span className="text-primary font-bold">{weights.workLifeWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.workLifeWeight}
                  onChange={(e) => setWeights({ ...weights, workLifeWeight: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Tech-Stack & Weiterbildung:</span>
                  <span className="text-primary font-bold">{weights.techStackWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.techStackWeight}
                  onChange={(e) => setWeights({ ...weights, techStackWeight: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Kultur & Benefits:</span>
                  <span className="text-primary font-bold">{weights.cultureBenefitsWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.cultureBenefitsWeight}
                  onChange={(e) => setWeights({ ...weights, cultureBenefitsWeight: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vergleichstabelle */}
        <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-surface-hover/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Rang & Angebot</th>
                <th className="px-4 py-3 font-semibold">Jahresgehalt / Netto</th>
                <th className="px-4 py-3 font-semibold">Work-Life (HO / Urlaub)</th>
                <th className="px-4 py-3 font-semibold">Tech & Kultur</th>
                <th className="px-4 py-3 font-semibold text-center">Teil-Scores</th>
                <th className="px-4 py-3 font-semibold text-right">Decision Score</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scoredOffers.map((offer) => {
                return (
                  <tr
                    key={offer.id}
                    className={`hover:bg-surface-hover/50 transition-colors ${
                      offer.isBestOffer ? "bg-emerald-500/10 font-medium" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            offer.rank === 1
                              ? "bg-amber-500 text-slate-950 font-black"
                              : "bg-surface-hover text-muted-foreground"
                          }`}
                        >
                          #{offer.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-foreground font-semibold">{offer.companyName}</p>
                            {offer.isBestOffer && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Trophy className="h-3 w-3" /> Empfehlung
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{offer.position}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {offer.baseSalaryAnnual.toLocaleString("de-DE")} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~{offer.estimatedNetMonthly.toLocaleString("de-DE")} € Netto / Mon.
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Home className="h-3.5 w-3.5 text-primary" /> {offer.homeOfficeDaysPerWeek} Tage HO/Woche
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {offer.vacationDays} Tage Urlaub
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">Tech:</span>
                          {"★".repeat(offer.techStackRating ?? 4)}
                          {"☆".repeat(5 - (offer.techStackRating ?? 4))}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">Kultur:</span>
                          {"★".repeat(offer.cultureRating ?? 4)}
                          {"☆".repeat(5 - (offer.cultureRating ?? 4))}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="rounded bg-surface-hover px-1.5 py-0.5" title="Gehaltsscore">
                          G: {offer.salaryScore}
                        </span>
                        <span className="rounded bg-surface-hover px-1.5 py-0.5" title="Work-Life-Score">
                          W: {offer.workLifeScore}
                        </span>
                        <span className="rounded bg-surface-hover px-1.5 py-0.5" title="Tech-Stack-Score">
                          T: {offer.techStackScore}
                        </span>
                        <span className="rounded bg-surface-hover px-1.5 py-0.5" title="Kultur-Score">
                          K: {offer.cultureBenefitsScore}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                          offer.isBestOffer
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-primary-soft text-primary"
                        }`}
                      >
                        {offer.totalDecisionScore} %
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
        <div className="rounded-xl border border-border p-4 bg-surface-hover/30 space-y-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-primary" /> Weiteres Angebot zur Matrix hinzufügen
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <label className="text-[11px] text-muted-foreground font-medium">Position</label>
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
              <label className="text-[11px] text-muted-foreground font-medium">Home-Office (Tage/Woche)</label>
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
              <label className="text-[11px] text-muted-foreground font-medium">Urlaubstage (Jahr)</label>
              <input
                type="number"
                min="20"
                max="40"
                value={vacation}
                onChange={(e) => setVacation(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Tech-Stack Rating (1-5)</label>
              <select
                value={techRating}
                onChange={(e) => setTechRating(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="5">5 Sterne (Modernste Tools / Next.js / TS)</option>
                <option value="4">4 Sterne (Guter Standard)</option>
                <option value="3">3 Sterne (Durchschnitt / etwas Legacy)</option>
                <option value="2">2 Sterne (Legacy-Stack)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Kultur-Rating (1-5)</label>
              <select
                value={cultureRating}
                onChange={(e) => setCultureRating(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="5">5 Sterne (Offen, agil, hohe Wertschätzung)</option>
                <option value="4">4 Sterne (Sympathisches Team)</option>
                <option value="3">3 Sterne (Neutral / Bürokratisch)</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                size="sm"
                className="w-full card-hover-effect"
                onClick={handleAdd}
                disabled={!companyName.trim()}
              >
                <Plus className="h-4 w-4 mr-1" /> Angebot hinzufügen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

