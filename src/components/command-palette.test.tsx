// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "./command-palette";

// Mock router
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock SWR to provide rich search data
vi.mock("swr", () => ({
  default: vi.fn((key: string | null) => {
    if (!key) return { data: undefined };
    if (key === "/api/applications") {
      return {
        data: [
          {
            id: "app-1",
            position: "Senior React Architect",
            status: "INTERVIEW",
            company: { name: "BonnTech Solutions", city: "Bonn" },
            tags: "React19,TypeScript,Remote",
            jobPosting: { techStack: "React 19, TypeScript, Next.js" },
          },
          {
            id: "app-2",
            position: "Fullstack Developer",
            status: "SENT",
            company: { name: "Cologne Web Labs", city: "Köln" },
            tags: "Vue,NodeJS",
            jobPosting: { techStack: "Vue 3, Node.js" },
          },
        ],
      };
    }
    if (key === "/api/companies") {
      return {
        data: [
          {
            id: "comp-1",
            name: "BonnTech Solutions",
            city: "Bonn",
            contactName: "Herr Schneider",
            tags: "Enterprise",
          },
        ],
      };
    }
    return { data: [] };
  }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("öffnet die Palette bei Tastenkombination Strg+K und schließt bei Escape", () => {
    render(<CommandPalette />);

    expect(screen.queryByRole("dialog")).toBeNull();

    // Trigger Ctrl+K
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeDefined();

    // Trigger Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("unterstützt Multi-Token-Suche über Position, Stadt und Tech-Stack", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByPlaceholderText(/Multi-Token-Suche/i);

    // Suche nach "Bonn React" (Reihenfolgeunabhängig)
    fireEvent.change(input, { target: { value: "Bonn React" } });

    expect(screen.getByText("Senior React Architect")).toBeDefined();
    expect(screen.queryByText("Fullstack Developer")).toBeNull();
  });

  it("filtert nach Kategorien über die Filter-Pills", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    // Klick auf "Firmen"
    const companyPill = screen.getByRole("button", { name: "Firmen" });
    fireEvent.click(companyPill);

    expect(screen.getByText("BonnTech Solutions")).toBeDefined();
    expect(screen.queryByText("Senior React Architect")).toBeNull();
  });

  it("navigiert per Pfeiltasten und Enter", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByPlaceholderText(/Multi-Token-Suche/i);

    fireEvent.change(input, { target: { value: "BonnTech" } });

    // ArrowDown und Enter
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(pushMock).toHaveBeenCalled();
  });
});
