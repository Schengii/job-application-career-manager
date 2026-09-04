"use client";

// -----------------------------------------------------------------------------
// Gemeinsam genutzter Hook für ausgeblendete Benachrichtigungs-IDs
// -----------------------------------------------------------------------------
// Wird sowohl von der Notification-Bell (src/components/notifications) als
// auch von der "Neue Rückmeldungen"-Karte auf dem Dashboard genutzt, damit
// eine an einer Stelle ausgeblendete Benachrichtigung konsistent überall
// verschwindet, statt pro Ansicht einen eigenen localStorage-Zustand zu
// pflegen.
//
// Jede Hook-Instanz hält ihren eigenen React-State (per `useState`, einmalig
// aus localStorage initialisiert) — ohne den Event-Mechanismus unten würde
// ein Dismiss in der NotificationBell zwar localStorage aktualisieren, aber
// eine bereits gemountete RecentResponsesCard nichts davon mitbekommen und
// die Benachrichtigung weiter anzeigen, bis die Seite neu geladen wird.
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";

export const NOTIFICATION_DISMISS_STORAGE_KEY = "career_manager_dismissed_notifs";

// Eigenes Event, das nach jeder Änderung ausgelöst wird, damit alle
// gleichzeitig gemounteten Hook-Instanzen im selben Dokument synchron
// bleiben — das native `storage`-Event feuert NUR in ANDEREN Tabs/Fenstern,
// nicht im selben Dokument, in dem die Änderung passiert ist.
const DISMISS_CHANGED_EVENT = "career-manager:dismissed-notifications-changed";

function readDismissedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(NOTIFICATION_DISMISS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useDismissedNotifications() {
  const [dismissedIds, setDismissedIds] = useState<string[]>(readDismissedIds);

  // Abonniert Änderungen von ANDEREN Hook-Instanzen (eigenes Event, selbes
  // Dokument) sowie von anderen Tabs/Fenstern (natives `storage`-Event) —
  // setState passiert hier bewusst nur innerhalb des Event-Callbacks, nicht
  // synchron im Effect-Body selbst.
  useEffect(() => {
    function syncFromStorage() {
      setDismissedIds(readDismissedIds());
    }
    window.addEventListener(DISMISS_CHANGED_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(DISMISS_CHANGED_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  function persist(updated: string[]) {
    setDismissedIds(updated);
    try {
      localStorage.setItem(NOTIFICATION_DISMISS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(DISMISS_CHANGED_EVENT));
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
