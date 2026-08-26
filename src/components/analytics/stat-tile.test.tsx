// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Briefcase } from "lucide-react";
import { StatTile } from "./stat-tile";

describe("StatTile", () => {
  it("rendert Label und Wert", () => {
    render(<StatTile label="Bewerbungen" value={42} icon={Briefcase} />);
    expect(screen.getByText("Bewerbungen")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("rendert ein optionales Suffix direkt neben dem Wert", () => {
    render(<StatTile label="Erfolgsquote" value={12.5} suffix="%" icon={Briefcase} />);
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("rendert ohne Suffix keinen leeren Suffix-Bereich", () => {
    render(<StatTile label="Bewerbungen" value={7} icon={Briefcase} />);
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("rendert einen optionalen Hinweistext", () => {
    render(<StatTile label="Bewerbungen" value={7} hint="Diese Woche +2" icon={Briefcase} />);
    expect(screen.getByText("Diese Woche +2")).toBeInTheDocument();
  });

  it("rendert das übergebene Icon dekorativ (aria-hidden)", () => {
    const { container } = render(<StatTile label="Bewerbungen" value={7} icon={Briefcase} />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden");
  });
});
