// -----------------------------------------------------------------------------
// Historischer Gehaltstrend-Tracker (Zeitreihen-Aggregator)
// -----------------------------------------------------------------------------
// Extrahiert und aggregiert Gehaltsangaben aus Stellenanzeigen, Angeboten und
// Notizen über die Monate, um den Marktwert und Gehaltstrend zu visualisieren.
// -----------------------------------------------------------------------------

export interface SalaryDataPoint {
  date: string; // YYYY-MM
  monthLabel: string;
  averageSalary: number;
  count: number;
  minSalary: number;
  maxSalary: number;
}

export interface ApplicationSalaryItem {
  createdAt: Date | string;
  notes?: string | null;
  jobPosting?: {
    salaryInfo?: string | null;
  } | null;
}

/**
 * Parst Gehaltsangaben (z.B. "55.000 €", "48k", "50000 - 60000 EUR") in eine Jahreszahl.
 */
export function extractSalaryAmount(text?: string | null): number | null {
  if (!text) return null;
  const clean = text.replace(/\./g, "").replace(/k\b/i, "000");
  const match = clean.match(/(\d{4,6})/);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  // Plausibilitätsbereich für Jahresgehälter (30k - 150k)
  if (val >= 25000 && val <= 160000) {
    return val;
  }
  return null;
}

export function aggregateSalaryTrends(applications: ApplicationSalaryItem[]): SalaryDataPoint[] {
  const monthsMap = new Map<string, { label: string; salaries: number[] }>();

  // Initialisiere die letzten 6 Monate
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
    monthsMap.set(key, { label, salaries: [] });
  }

  for (const app of applications) {
    const d = new Date(app.createdAt);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!monthsMap.has(key)) continue;

    const salary =
      extractSalaryAmount(app.jobPosting?.salaryInfo) ??
      extractSalaryAmount(app.notes);

    if (salary) {
      monthsMap.get(key)!.salaries.push(salary);
    }
  }

  return Array.from(monthsMap.entries()).map(([key, data]) => {
    const count = data.salaries.length;
    if (count === 0) {
      return {
        date: key,
        monthLabel: data.label,
        averageSalary: 0,
        count: 0,
        minSalary: 0,
        maxSalary: 0,
      };
    }

    const sum = data.salaries.reduce((acc, val) => acc + val, 0);
    return {
      date: key,
      monthLabel: data.label,
      averageSalary: Math.round(sum / count),
      count,
      minSalary: Math.min(...data.salaries),
      maxSalary: Math.max(...data.salaries),
    };
  });
}
