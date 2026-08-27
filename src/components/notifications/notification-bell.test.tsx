// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { NotificationBell } from "./notification-bell";
import type { ApplicationListItem } from "@/types";

// SWRs Default-Cache ist ein modulweiter Singleton, der auch über
// `cleanup()` hinaus zwischen Tests bestehen bleibt — ohne eigenen,
// frischen Cache pro Test (inkl. `dedupingInterval: 0`) würde ein späterer
// Test denselben Key ("/api/applications") als bereits kürzlich
// abgerufen ansehen und den hier gemockten `fetch` gar nicht erst aufrufen.
function renderNotificationBell() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <NotificationBell />
    </SWRConfig>,
  );
}

const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

function makeOverdueApp(overrides: { id: string; companyName: string; position: string }): ApplicationListItem {
  return {
    id: overrides.id,
    status: "INTERVIEW",
    position: overrides.position,
    applicationDate: new Date().toISOString(),
    nextStep: "Telefoninterview",
    nextStepDate: YESTERDAY,
    company: { name: overrides.companyName },
  } as unknown as ApplicationListItem;
}

function mockApplications(applications: ApplicationListItem[]) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(applications), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("NotificationBell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("zeigt keinen Badge-Zähler, solange keine Benachrichtigungen vorliegen", async () => {
    const fetchMock = mockApplications([]);
    renderNotificationBell();
    const bell = screen.getByRole("button", { name: "Benachrichtigungen" });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(within(bell).queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("zeigt die Anzahl überfälliger Termine als Badge an", async () => {
    mockApplications([makeOverdueApp({ id: "1", companyName: "Acme GmbH", position: "Frontend Entwickler" })]);
    renderNotificationBell();

    expect(await screen.findByText("1")).toBeInTheDocument();
  });

  it("öffnet beim Klick das Popover mit der überfälligen Benachrichtigung", async () => {
    mockApplications([makeOverdueApp({ id: "1", companyName: "Acme GmbH", position: "Frontend Entwickler" })]);
    const user = userEvent.setup();
    renderNotificationBell();

    await screen.findByText("1"); // warten, bis die Benachrichtigungen geladen sind
    await user.click(screen.getByRole("button", { name: "Benachrichtigungen" }));

    expect(screen.getByText("Acme GmbH")).toBeInTheDocument();
    expect(screen.getByText("Termin / Schritt überfällig!")).toBeInTheDocument();
  });

  it("blendet eine einzelne Benachrichtigung aus und merkt sich das dauerhaft in localStorage", async () => {
    mockApplications([makeOverdueApp({ id: "1", companyName: "Acme GmbH", position: "Frontend Entwickler" })]);
    const user = userEvent.setup();
    renderNotificationBell();

    await screen.findByText("1");
    await user.click(screen.getByRole("button", { name: "Benachrichtigungen" }));
    await user.click(screen.getByRole("button", { name: "Ausblenden" }));

    expect(screen.getByText(/Alles erledigt/)).toBeInTheDocument();
    // Die ID enthält seit dem Dedup-Fix (s. notifications.test.ts) auch das
    // Zieldatum, nicht nur die Application-ID — sonst würde eine
    // Terminverschiebung eine bereits verworfene Benachrichtigung dauerhaft
    // unterdrücken.
    const expectedDateKey = new Date(YESTERDAY).toISOString().slice(0, 10);
    expect(JSON.parse(localStorage.getItem("career_manager_dismissed_notifs")!)).toEqual([
      `overdue-1-${expectedDateKey}`,
    ]);
  });
});
