// -----------------------------------------------------------------------------
// Kanban WIP-Limits & Ghosting-Erkennung
// -----------------------------------------------------------------------------
// Unterstützt agiles Pipeline-Management für die Jobsuche:
// 1. WIP-Limits (Work-in-Progress): Begrenzung aktiver Bewerbungen in kritischen Phasen.
// 2. Ghosting-Erkennung: Automatische Kennzeichnung von Bewerbungen ohne Rückmeldung nach 30+ Tagen.
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";

export const DEFAULT_WIP_LIMITS: Record<string, number | null> = {
  DRAFT: 10,
  SENT: 15,
  INTERVIEW: 5,
  OFFER: null,
  REJECTED: null,
  WITHDRAWN: null,
};

export type WipStatus = {
  limit: number | null;
  count: number;
  isOverloaded: boolean;
  label: string;
};

export function checkColumnWip(
  status: string,
  count: number,
  customLimits: Record<string, number | null> = DEFAULT_WIP_LIMITS
): WipStatus {
  const limit = customLimits[status] ?? null;
  const isOverloaded = limit !== null && count > limit;
  const label = limit !== null ? `${count}/${limit}` : `${count}`;

  return {
    limit,
    count,
    isOverloaded,
    label,
  };
}

export type GhostingStatus = {
  isGhosting: boolean;
  daysSinceApplication: number;
  label?: string;
};

export function detectGhosting(
  application: ApplicationListItem,
  thresholdDays = 30,
  referenceDate = new Date()
): GhostingStatus {
  if (application.status !== "SENT" || !application.applicationDate) {
    return { isGhosting: false, daysSinceApplication: 0 };
  }

  const appDate = new Date(application.applicationDate);
  const diffMs = referenceDate.getTime() - appDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isGhosting = days >= thresholdDays;

  return {
    isGhosting,
    daysSinceApplication: days,
    label: isGhosting ? `Keine Rückmeldung seit ${days} Tagen` : undefined,
  };
}
