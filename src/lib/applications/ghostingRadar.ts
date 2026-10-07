// -----------------------------------------------------------------------------
// Ghosting-Radar & SLA / Stagnations-Indikator
// -----------------------------------------------------------------------------
// Berechnet Verweildauern und Ghosting-Risiken für offene Bewerbungen,
// um rechtzeitiges Nachfassen und saubere Pipeline-Pflege zu ermöglichen.
// -----------------------------------------------------------------------------

export type GhostingRiskLevel = "normal" | "warning" | "danger";

export type GhostingStatus = {
  applicationId: string;
  daysWaiting: number;
  level: GhostingRiskLevel;
  badgeLabel: string;
  badgeColor: string; // Tailwind Farbkombination
  recommendedAction: string;
  suggestedTemplate?: "FRIENDLY_INQUIRY" | "THANK_YOU_INTERVIEW" | "ARCHIVE";
  isActionRequired: boolean;
};

export type ApplicationGhostingInput = {
  id: string;
  status: string;
  applicationDate?: string | Date | null;
  nextStepDate?: string | Date | null;
  updatedAt?: string | Date | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Ermittelt das Ghosting- und Stagnations-Risiko einer Bewerbung.
 */
export function evaluateGhostingStatus(
  app: ApplicationGhostingInput,
  nowDate: Date = new Date()
): GhostingStatus {
  const now = nowDate.getTime();
  const relevantDateStr = app.applicationDate || app.updatedAt;
  const baseTime = relevantDateStr ? new Date(relevantDateStr).getTime() : now;
  const daysWaiting = Math.max(0, Math.floor((now - baseTime) / MS_PER_DAY));

  // Abgeschlossene oder in Entwurf befindliche Bewerbungen
  if (["DRAFT", "OFFER", "REJECTED", "WITHDRAWN"].includes(app.status)) {
    return {
      applicationId: app.id,
      daysWaiting,
      level: "normal",
      badgeLabel: "Abgeschlossen / Entwurf",
      badgeColor: "bg-surface text-muted-foreground border-border",
      recommendedAction: "Keine Aktion nötig",
      isActionRequired: false,
    };
  }

  // Status SENT (Bewerbung versendet, Warten auf Erst-Rückmeldung)
  if (app.status === "SENT") {
    if (daysWaiting >= 30) {
      return {
        applicationId: app.id,
        daysWaiting,
        level: "danger",
        badgeLabel: `🔴 Ghosting-Risiko (${daysWaiting} Tage)`,
        badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
        recommendedAction: "Letztes Nachfassen oder als geghostet archivieren",
        suggestedTemplate: "ARCHIVE",
        isActionRequired: true,
      };
    }

    if (daysWaiting >= 14) {
      return {
        applicationId: app.id,
        daysWaiting,
        level: "warning",
        badgeLabel: `🟡 Nachfassen fällig (${daysWaiting} Tage)`,
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        recommendedAction: "Freundliche Nachfrage zum Stand der Bewerbung senden",
        suggestedTemplate: "FRIENDLY_INQUIRY",
        isActionRequired: true,
      };
    }

    return {
      applicationId: app.id,
      daysWaiting,
      level: "normal",
      badgeLabel: `🟢 In Prüfung (${daysWaiting} Tage)`,
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      recommendedAction: "Reguläre Bearbeitungszeit des Unternehmens",
      isActionRequired: false,
    };
  }

  // Status INTERVIEW (Im Gesprächsprozess)
  if (app.status === "INTERVIEW") {
    // Hat ein nächstes Schritt-Datum?
    if (app.nextStepDate) {
      const nextStepTime = new Date(app.nextStepDate).getTime();
      const daysSinceNextStep = Math.floor((now - nextStepTime) / MS_PER_DAY);

      if (daysSinceNextStep > 7) {
        return {
          applicationId: app.id,
          daysWaiting: daysSinceNextStep,
          level: "danger",
          badgeLabel: `🔴 Feedback überfällig (${daysSinceNextStep} Tage)`,
          badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
          recommendedAction: "Status-Check nach Interview / Coding-Challenge senden",
          suggestedTemplate: "THANK_YOU_INTERVIEW",
          isActionRequired: true,
        };
      }

      if (daysSinceNextStep >= 3) {
        return {
          applicationId: app.id,
          daysWaiting: daysSinceNextStep,
          level: "warning",
          badgeLabel: `🟡 Feedback ausstehend (${daysSinceNextStep} Tage)`,
          badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          recommendedAction: "Kurze Dankes- oder Nachfassnachricht prüfen",
          suggestedTemplate: "THANK_YOU_INTERVIEW",
          isActionRequired: true,
        };
      }
    } else if (daysWaiting >= 14) {
      return {
        applicationId: app.id,
        daysWaiting,
        level: "danger",
        badgeLabel: `🔴 Gesprächsrunde stagniert (${daysWaiting} Tage)`,
        badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
        recommendedAction: "Rücksprache mit HR / Fachabteilung suchen",
        suggestedTemplate: "THANK_YOU_INTERVIEW",
        isActionRequired: true,
      };
    }

    return {
      applicationId: app.id,
      daysWaiting,
      level: "normal",
      badgeLabel: "🟢 Interview aktiv",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      recommendedAction: "Gesprächsvorbereitung oder Feedback abwarten",
      isActionRequired: false,
    };
  }

  return {
    applicationId: app.id,
    daysWaiting,
    level: "normal",
    badgeLabel: "Normal",
    badgeColor: "bg-surface text-muted-foreground border-border",
    recommendedAction: "Keine Aktion nötig",
    isActionRequired: false,
  };
}

/**
 * Aggregiert alle Bewerbungen für das Dashboard und Filter.
 */
export function getGhostingOverview(
  applications: ApplicationGhostingInput[],
  nowDate: Date = new Date()
) {
  const evaluated = applications.map((app) => evaluateGhostingStatus(app, nowDate));
  const followUpDue = evaluated.filter((e) => e.level === "warning");
  const ghostedHighRisk = evaluated.filter((e) => e.level === "danger");
  const actionRequiredCount = followUpDue.length + ghostedHighRisk.length;

  return {
    totalEvaluated: evaluated.length,
    actionRequiredCount,
    warningCount: followUpDue.length,
    dangerCount: ghostedHighRisk.length,
    urgentApplications: evaluated.filter((e) => e.isActionRequired),
  };
}
