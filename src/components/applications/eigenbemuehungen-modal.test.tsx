// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EigenbemuehungenModal } from "./eigenbemuehungen-modal";
import type { ApplicationListItem } from "@/types";

describe("EigenbemuehungenModal", () => {
  const sampleApps: ApplicationListItem[] = [
    {
      id: "app-1",
      companyId: "comp-1",
      jobPostingId: null,
      position: "Frontend Entwickler",
      status: "SENT",
      applicationDate: new Date(),
      nextStep: "Rückmeldung abwarten",
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: null,
      interviewStage: null,
      timeSpentMinutes: 30,
      tags: "React",
      notes: null,
      source: "Stepstone",
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        id: "comp-1",
        name: "Testfirma GmbH",
        street: "Musterstr. 1",
        postalCode: "53111",
        city: "Bonn",
        country: "Deutschland",
        website: null,
        contactName: "Herr Meier",
        contactPhone: null,
        contactEmail: null,
        notes: null,
        tags: null,
        status: "LEAD",
        letterTemplate: null,
        preferredTone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      jobPosting: null,
      coverLetter: null,
      statusEvents: [],
      _count: { statusEvents: 0, documents: 0 },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rendert den Dialog mit Drucken- und Herunterladen-Button", () => {
    render(
      <EigenbemuehungenModal
        open={true}
        onClose={() => {}}
        applications={sampleApps}
      />
    );

    expect(screen.getByText(/Nachweis von Eigenbemühungen/i)).toBeDefined();
    expect(screen.getByText(/Herunterladen \(\.html\)/i)).toBeDefined();
    expect(screen.getByText(/Drucken \/ PDF/i)).toBeDefined();
    expect(screen.getByText("Testfirma GmbH")).toBeDefined();
  });

  it("triggert den Download beim Klick auf Herunterladen", () => {
    // Mock URL.createObjectURL and revokeObjectURL
    const createObjectUrlMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectUrlMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectUrlMock;
    globalThis.URL.revokeObjectURL = revokeObjectUrlMock;

    render(
      <EigenbemuehungenModal
        open={true}
        onClose={() => {}}
        applications={sampleApps}
      />
    );

    const downloadBtn = screen.getByText(/Herunterladen \(\.html\)/i);
    fireEvent.click(downloadBtn);

    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:mock-url");
  });
});
