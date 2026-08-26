// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecentResponsesCard } from "./recent-responses-card";
import type { ApplicationListItem } from "@/types";

function makeApp(overrides: {
  id: string;
  companyName: string;
  position: string;
  status: string;
  eventStatus: string;
}): ApplicationListItem {
  return {
    id: overrides.id,
    status: overrides.status,
    position: overrides.position,
    applicationDate: new Date().toISOString(),
    nextStep: null,
    nextStepDate: null,
    company: { name: overrides.companyName },
    statusEvents: [{ id: `evt-${overrides.id}`, status: overrides.eventStatus, changedAt: new Date().toISOString() }],
  } as unknown as ApplicationListItem;
}

describe("RecentResponsesCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("rendert nichts, wenn es keine neuen Rückmeldungen gibt", () => {
    const { container } = render(<RecentResponsesCard applications={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("zeigt eine Absage- und eine Zusage-Benachrichtigung an", () => {
    const apps = [
      makeApp({ id: "1", companyName: "Absage GmbH", position: "Frontend", status: "REJECTED", eventStatus: "REJECTED" }),
      makeApp({ id: "2", companyName: "Zusage AG", position: "Backend", status: "OFFER", eventStatus: "OFFER" }),
    ];
    render(<RecentResponsesCard applications={apps} />);

    expect(screen.getByText("Absage GmbH")).toBeInTheDocument();
    expect(screen.getByText("Zusage AG")).toBeInTheDocument();
    expect(screen.getByText("Absage erhalten")).toBeInTheDocument();
    expect(screen.getByText("Zusage / Angebot erhalten 🎉")).toBeInTheDocument();
  });

  it("blendet eine ausgeblendete Benachrichtigung dauerhaft aus", async () => {
    const apps = [makeApp({ id: "1", companyName: "Absage GmbH", position: "Frontend", status: "REJECTED", eventStatus: "REJECTED" })];
    const user = userEvent.setup();
    const { container } = render(<RecentResponsesCard applications={apps} />);

    await user.click(screen.getByRole("button", { name: "Benachrichtigung ausblenden" }));

    expect(container).toBeEmptyDOMElement();
    expect(JSON.parse(localStorage.getItem("career_manager_dismissed_notifs")!)).toEqual(["status-evt-1"]);
  });
});
