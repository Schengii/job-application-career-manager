// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("rendert Kinder und reagiert per Default als primärer Button", () => {
    render(<Button>Speichern</Button>);
    const button = screen.getByRole("button", { name: "Speichern" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });

  it("wendet die Klassen der gewählten Variante und Größe an", () => {
    render(
      <Button variant="danger" size="sm">
        Löschen
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Löschen" });
    expect(button).toHaveClass("bg-danger");
    expect(button).toHaveClass("h-8");
  });

  it("ruft onClick beim Klicken auf", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Klick mich</Button>);

    await user.click(screen.getByRole("button", { name: "Klick mich" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ist deaktiviert und feuert kein onClick, wenn disabled gesetzt ist", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Gesperrt
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Gesperrt" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("mischt eine übergebene className mit den Standardklassen, statt sie zu ersetzen", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button", { name: "Custom" });
    expect(button).toHaveClass("custom-class");
    expect(button).toHaveClass("bg-primary");
  });

  it("reicht native Button-Attribute wie type durch", () => {
    render(<Button type="submit">Absenden</Button>);
    expect(screen.getByRole("button", { name: "Absenden" })).toHaveAttribute("type", "submit");
  });
});
