// -----------------------------------------------------------------------------
// Follow-up / Wiedervorlage-Engine
// -----------------------------------------------------------------------------
// Berechnet den Status von Fristen, überfälligen Terminen und empfiehlt
// proaktives Nachfassen bei Bewerbungen ohne Rückmeldung.
// -----------------------------------------------------------------------------

export const FOLLOW_UP_THRESHOLD_DAYS = 14; // Nach 14 Tagen ohne Rückmeldung Nachfassen empfehlen

export type FollowUpStatus = {
  daysSinceApplication: number | null;
  isFollowUpSuggested: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
  daysUntilNextStep: number | null;
};

export function getFollowUpStatus(app: {
  status: string;
  applicationDate?: Date | string | null;
  nextStepDate?: Date | string | null;
}): FollowUpStatus {
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let daysSinceApplication: number | null = null;
  if (app.applicationDate) {
    const appDate = new Date(app.applicationDate);
    const appMs = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate()).getTime();
    daysSinceApplication = Math.max(0, Math.floor((todayMs - appMs) / (1000 * 60 * 60 * 24)));
  }

  let daysUntilNextStep: number | null = null;
  let isOverdue = false;
  let isDueSoon = false;

  if (app.nextStepDate) {
    const stepDate = new Date(app.nextStepDate);
    const stepMs = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate()).getTime();
    daysUntilNextStep = Math.round((stepMs - todayMs) / (1000 * 60 * 60 * 24));
    if (daysUntilNextStep < 0) {
      isOverdue = true;
    } else if (daysUntilNextStep <= 3) {
      isDueSoon = true;
    }
  }

  // Nachfassen wird nur für versendete Bewerbungen ohne Folgestatus (DRAFT, INTERVIEW, OFFER, REJECTED, WITHDRAWN) empfohlen
  const isFollowUpSuggested =
    app.status === "SENT" &&
    daysSinceApplication !== null &&
    daysSinceApplication >= FOLLOW_UP_THRESHOLD_DAYS;

  return {
    daysSinceApplication,
    isFollowUpSuggested,
    isOverdue,
    isDueSoon,
    daysUntilNextStep,
  };
}
