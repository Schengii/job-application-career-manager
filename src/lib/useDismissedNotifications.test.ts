// @vitest-environment jsdom
// -----------------------------------------------------------------------------
// Regressionstest für einen Bug: zwei gleichzeitig gemountete Instanzen des
// Hooks (z.B. NotificationBell in der Sidebar + RecentResponsesCard auf dem
// Dashboard) hielten bisher unabhängige React-States. Ein Dismiss in der
// einen Instanz aktualisierte localStorage, aber die andere, bereits
// gemountete Instanz bekam davon nichts mit und zeigte die Benachrichtigung
// weiter an, bis die Seite neu geladen wurde.
// -----------------------------------------------------------------------------
import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDismissedNotifications, NOTIFICATION_DISMISS_STORAGE_KEY } from "./useDismissedNotifications";

describe("useDismissedNotifications", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("liest ausgeblendete IDs initial aus localStorage", () => {
    localStorage.setItem(NOTIFICATION_DISMISS_STORAGE_KEY, JSON.stringify(["a", "b"]));
    const { result } = renderHook(() => useDismissedNotifications());
    expect(result.current.dismissedIds).toEqual(["a", "b"]);
  });

  it("synchronisiert ein dismiss() sofort zu einer ANDEREN, gleichzeitig gemounteten Hook-Instanz", () => {
    const bell = renderHook(() => useDismissedNotifications());
    const dashboardCard = renderHook(() => useDismissedNotifications());

    expect(bell.result.current.dismissedIds).toEqual([]);
    expect(dashboardCard.result.current.dismissedIds).toEqual([]);

    act(() => {
      bell.result.current.dismiss("overdue-app-1");
    });

    expect(bell.result.current.dismissedIds).toEqual(["overdue-app-1"]);
    // Vor dem Fix wäre dies noch [] gewesen — die zweite Instanz bekam die
    // Änderung der ersten nicht mit.
    expect(dashboardCard.result.current.dismissedIds).toEqual(["overdue-app-1"]);
  });

  it("synchronisiert dismissMany() ebenfalls zu allen Instanzen", () => {
    const bell = renderHook(() => useDismissedNotifications());
    const dashboardCard = renderHook(() => useDismissedNotifications());

    act(() => {
      dashboardCard.result.current.dismissMany(["a", "b"]);
    });

    expect(bell.result.current.dismissedIds.sort()).toEqual(["a", "b"]);
  });
});
