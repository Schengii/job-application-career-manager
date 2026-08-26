// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LiveJobSearchModal } from "./live-job-search-modal";
import { apiPost } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiPost: vi.fn(),
}));

const mockedApiPost = vi.mocked(apiPost);

function renderModal(onJobAdded = vi.fn()) {
  return render(<LiveJobSearchModal open onClose={vi.fn()} onJobAdded={onJobAdded} />);
}

describe("LiveJobSearchModal", () => {
  beforeEach(() => {
    mockedApiPost.mockReset();
  });

  it("startet mit einem Umkreis von 50 km und zeigt ihn im Label an", () => {
    renderModal();
    expect(screen.getByText("50 km")).toBeInTheDocument();
    expect(screen.getByLabelText(/umkreis/i)).toHaveValue("50");
  });

  it("aktualisiert den angezeigten Umkreis, wenn der Regler bewegt wird", () => {
    renderModal();
    const slider = screen.getByLabelText(/umkreis/i);

    fireEvent.change(slider, { target: { value: "120" } });

    expect(slider).toHaveValue("120");
    expect(screen.getByText("120 km")).toBeInTheDocument();
  });

  it("sendet den eingestellten Umkreis als Zahl bei der Suche mit", async () => {
    mockedApiPost.mockResolvedValueOnce({ success: true, jobs: [], totalFound: 0, sourcesQueried: [] });
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText(/umkreis/i), { target: { value: "80" } });
    await user.click(screen.getByRole("button", { name: /suchen/i }));

    await waitFor(() => expect(mockedApiPost).toHaveBeenCalledTimes(1));
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/api/jobs/live-search",
      expect.objectContaining({ radius: 80 }),
    );
  });

  it("zeigt gefundene Treffer inklusive Match-Score nach erfolgreicher Suche an", async () => {
    mockedApiPost.mockResolvedValueOnce({
      success: true,
      totalFound: 1,
      sourcesQueried: ["ARBEITNOW"],
      jobs: [
        {
          title: "React Entwickler",
          companyName: "Acme GmbH",
          location: "Bonn",
          description: "Spannende Rolle im Frontend-Team.",
          portalSource: "ARBEITNOW",
          sourceUrl: "https://example.com/job/1",
          remote: true,
          matchScore: 87,
        },
      ],
    });
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /suchen/i }));

    expect(await screen.findByText("React Entwickler")).toBeInTheDocument();
    expect(screen.getByText("Match: 87%")).toBeInTheDocument();
    expect(screen.getByText("Acme GmbH")).toBeInTheDocument();
  });

  it("übernimmt einen gefundenen Job und markiert ihn danach als hinzugefügt", async () => {
    const onJobAdded = vi.fn();
    mockedApiPost
      .mockResolvedValueOnce({
        success: true,
        totalFound: 1,
        sourcesQueried: ["ARBEITNOW"],
        jobs: [
          {
            title: "React Entwickler",
            companyName: "Acme GmbH",
            location: "Bonn",
            description: "Spannende Rolle im Frontend-Team.",
            portalSource: "ARBEITNOW",
            sourceUrl: "https://example.com/job/1",
            remote: true,
            matchScore: 87,
          },
        ],
      })
      .mockResolvedValueOnce({ id: "company-1" }) // POST /api/companies
      .mockResolvedValueOnce({}); // POST /api/jobs

    const user = userEvent.setup();
    renderModal(onJobAdded);

    await user.click(screen.getByRole("button", { name: /suchen/i }));
    await screen.findByText("React Entwickler");

    await user.click(screen.getByRole("button", { name: /übernehmen/i }));

    expect(await screen.findByRole("button", { name: /übernommen/i })).toBeDisabled();
    expect(onJobAdded).toHaveBeenCalledTimes(1);
  });
});
