// -----------------------------------------------------------------------------
// Berechnungs-Engine für Kündigungsfristen & frühestmöglichen Eintrittstermin
// -----------------------------------------------------------------------------
// Berücksichtigt:
// - Gesetzliche Kündigungsfristen nach BGB § 622 (Abs. 1 & Abs. 2)
// - Vertragliche Kündigungsfristen (Wochen/Monate zum 15., Monatsende, Quartalsende)
// - Probezeit-Kündigungsfrist (2 Wochen zu jedem Tag)
// - Verbleibende Resturlaubstage & Überstundenabbau
// - Automatische Formulierungsempfehlungen für Bewerbungsanschreiben
// -----------------------------------------------------------------------------

export type NoticePeriodRule =
  | "PROBATION_2_WEEKS" // 2 Wochen zu jedem Tag (Probezeit)
  | "BGB_STATUTORY" // 4 Wochen zum 15. oder Monatsende
  | "MONTHS_END" // X Monate zum Monatsende
  | "MONTHS_MID_OR_END" // X Monate zum 15. oder Monatsende
  | "QUARTER_END" // X Monate zum Quartalsende
  | "IMMEDIATE"; // Sofort verfügbar (arbeitslos / Umschulung beendet / Freelancer)

export interface NoticePeriodConfig {
  currentStatus: "EMPLOYED" | "NOTICE_GIVEN" | "UNEMPLOYED_OR_STUDENT";
  rule: NoticePeriodRule;
  customMonths?: number; // z.B. 3 Monate
  referenceDate?: Date; // Basis-Stichtag (Default: heute)
  noticeGivenDate?: Date; // Falls bereits gekündigt: Datum des Austritts
  remainingVacationDays?: number; // Urlaubstage, die vor Austritt genommen werden
  overtimeHours?: number; // Überstunden, die abgefeiert werden (8h = 1 Tag)
  weeklyWorkHours?: number; // z.B. 40
}

export interface NoticePeriodResult {
  lastWorkingDay: Date;
  earliestStartDate: Date;
  effectiveFreeDays: number;
  noticeTargetDescription: string;
  coverLetterSnippet: string;
  isImmediatelyAvailable: boolean;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getMidOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 15);
}

function getEndOfQuarter(date: Date): Date {
  const currentMonth = date.getMonth(); // 0-11
  const quarterEndMonth = Math.floor(currentMonth / 3) * 3 + 2; // 2 (März), 5 (Juni), 8 (Sept), 11 (Dez)
  return new Date(date.getFullYear(), quarterEndMonth + 1, 0);
}

export function calculateNoticePeriod(config: NoticePeriodConfig): NoticePeriodResult {
  const today = config.referenceDate ? new Date(config.referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  if (config.currentStatus === "UNEMPLOYED_OR_STUDENT" || config.rule === "IMMEDIATE") {
    const immediateDate = addDays(today, 1);
    return {
      lastWorkingDay: today,
      earliestStartDate: immediateDate,
      effectiveFreeDays: 0,
      noticeTargetDescription: "Sofort verfügbar (keine Kündigungsfrist)",
      coverLetterSnippet: "Da ich mich derzeit in keinem ungekündigten Arbeitsverhältnis befinde, kann ich die Position ab sofort bzw. kurzfristig antreten.",
      isImmediatelyAvailable: true,
    };
  }

  if (config.currentStatus === "NOTICE_GIVEN" && config.noticeGivenDate) {
    const exitDate = new Date(config.noticeGivenDate);
    exitDate.setHours(0, 0, 0, 0);

    const vacationDays = config.remainingVacationDays || 0;
    const overtimeDays = Math.floor((config.overtimeHours || 0) / ((config.weeklyWorkHours || 40) / 5));
    const totalOffDays = vacationDays + overtimeDays;

    const lastWorkDay = addDays(exitDate, -totalOffDays);
    const startDate = addDays(exitDate, 1);

    const formattedDate = startDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

    return {
      lastWorkingDay: lastWorkDay,
      earliestStartDate: startDate,
      effectiveFreeDays: totalOffDays,
      noticeTargetDescription: `Kündigung bereits eingereicht, Austritt zum ${exitDate.toLocaleDateString("de-DE")}`,
      coverLetterSnippet: `Aufgrund meines bereits feststehenden Austritts stehe ich Ihnen ab dem ${formattedDate} in Vollzeit zur Verfügung.`,
      isImmediatelyAvailable: false,
    };
  }

  // Aktive Kündigung berechnen
  let exitDate: Date;
  let ruleDesc = "";

  switch (config.rule) {
    case "PROBATION_2_WEEKS": {
      exitDate = addDays(today, 14);
      ruleDesc = "2 Wochen Kündigungsfrist während der Probezeit";
      break;
    }

    case "BGB_STATUTORY": {
      // 4 Wochen zum 15. oder Monatsende
      const candidateDate = addDays(today, 28);
      const endOfCurrMonth = getEndOfMonth(candidateDate);
      const midOfCurrMonth = getMidOfMonth(candidateDate);

      if (candidateDate <= midOfCurrMonth) {
        exitDate = midOfCurrMonth;
        ruleDesc = "4 Wochen zum 15. eines Monats (BGB § 622 Abs. 1)";
      } else {
        exitDate = endOfCurrMonth;
        ruleDesc = "4 Wochen zum Monatsende (BGB § 622 Abs. 1)";
      }
      break;
    }

    case "MONTHS_END": {
      const months = config.customMonths || 1;
      const targetMonthDate = new Date(today.getFullYear(), today.getMonth() + months + 1, 0);
      exitDate = targetMonthDate;
      ruleDesc = `${months} Monat(e) zum Monatsende`;
      break;
    }

    case "MONTHS_MID_OR_END": {
      const months = config.customMonths || 1;
      const futureDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
      const mid = getMidOfMonth(futureDate);
      const end = getEndOfMonth(futureDate);

      if (futureDate <= mid) {
        exitDate = mid;
      } else {
        exitDate = end;
      }
      ruleDesc = `${months} Monat(e) zum 15. oder Monatsende`;
      break;
    }

    case "QUARTER_END": {
      const months = config.customMonths || 3;
      const candidateDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
      exitDate = getEndOfQuarter(candidateDate);
      ruleDesc = `${months} Monat(e) zum Quartalsende`;
      break;
    }

    default: {
      exitDate = getEndOfMonth(addDays(today, 30));
      ruleDesc = "1 Monat zum Monatsende";
    }
  }

  const vacationDays = config.remainingVacationDays || 0;
  const overtimeDays = Math.floor((config.overtimeHours || 0) / ((config.weeklyWorkHours || 40) / 5));
  const totalOffDays = vacationDays + overtimeDays;

  const lastWorkDay = addDays(exitDate, -totalOffDays);
  const startDate = addDays(exitDate, 1);
  const formattedStartDate = startDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return {
    lastWorkingDay: lastWorkDay,
    earliestStartDate: startDate,
    effectiveFreeDays: totalOffDays,
    noticeTargetDescription: `${ruleDesc} (Austritt voraussichtlich: ${exitDate.toLocaleDateString("de-DE")})`,
    coverLetterSnippet: `Unter Berücksichtigung meiner vertraglichen Kündigungsfrist stehe ich Ihnen ab dem ${formattedStartDate} zur Verfügung.`,
    isImmediatelyAvailable: false,
  };
}
