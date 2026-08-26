"use client";

// -----------------------------------------------------------------------------
// Gemeinsam genutzter Hook für ausgeblendete Benachrichtigungs-IDs
// -----------------------------------------------------------------------------
// Wird sowohl von der Notification-Bell (src/components/notifications) als
// auch von der "Neue Rückmeldungen"-Karte auf dem Dashboard genutzt, damit
// eine an einer Stelle ausgeblendete Benachrichtigung konsistent überall
// verschwindet, statt pro Ansicht einen eigenen localStorage-Zustand zu
// pflegen.
// -----------------------------------------------------------------------------
import { useState } from "react";

export const NOTIFICATION_DISMISS_STORAGE_KEY = "career_manager_dismissed_notifs";

export function useDismissedNotifications() {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(NOTIFICATION_DISMISS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function persist(updated: string[]) {
    setDismissedIds(updated);
    try {
      localStorage.setItem(NOTIFICATION_DISMISS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage kann in seltenen Fällen nicht verfügbar sein (z.B. privater
      // Modus mit vollem Speicher) — die Benachrichtigung bleibt dann nur für
      // die aktuelle Sitzung ausgeblendet, was ein akzeptabler Fallback ist.
    }
  }

  function dismiss(id: string) {
    persist([...dismissedIds, id]);
  }

  function dismissMany(ids: string[]) {
    persist(Array.from(new Set([...dismissedIds, ...ids])));
  }

  return { dismissedIds, dismiss, dismissMany };
}
