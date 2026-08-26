// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompanyFormDialog } from "./company-form-dialog";
import { ToastProvider } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiPost: vi.fn(),
}));

const mockedApiPost = vi.mocked(apiPost);

// useToast() liefert ohne einen umschließenden ToastProvider stillschweigend
// No-Op-Funktionen zurück (siehe src/components/ui/toast.tsx) — ohne diesen
// Wrapper würden toast.success()/toast.error() hier nie sichtbaren Text erzeugen.
function renderDialog(props: { open: boolean; onClose: () => void }) {
  return render(
    <ToastProvider>
      <CompanyFormDialog {...props} />
    </ToastProvider>,
  );
}

describe("CompanyFormDialog", () => {
  beforeEach(() => {
    mockedApiPost.mockReset();
  });

  it("rendert das <dialog>-Element ohne 'open'-Attribut, wenn open=false", () => {
    // dialog.tsx rendert Titel/Inhalt IMMER ins DOM (siehe Dialog-Komponente)
    // — Sichtbarkeit steuert ausschließlich das native `open`-Attribut über
    // showModal()/close(), nicht bedingtes Rendering. Daher hier NICHT auf
    // Abwesenheit des Titeltexts prüfen (der ist immer im DOM), sondern auf
    // das fehlende `open`-Attribut.
    const { container } = renderDialog({ open: false, onClose: vi.fn() });
    expect(container.querySelector("dialog")).not.toHaveAttribute("open");
  });

  it("legt ein Unternehmen mit den eingegebenen Feldern und dem Status-Default 'LEAD' an", async () => {
    mockedApiPost.mockResolvedValueOnce({ id: "1", name: "Acme GmbH" });
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ open: true, onClose });

    await user.type(screen.getByLabelText(/^name/i), "Acme GmbH");
    await user.type(screen.getByLabelText(/stadt/i), "Bonn");
    await user.click(screen.getByRole("button", { name: "Unternehmen anlegen" }));

    expect(mockedApiPost).toHaveBeenCalledExactlyOnceWith(
      "/api/companies",
      expect.objectContaining({ name: "Acme GmbH", city: "Bonn", status: "LEAD" }),
    );
    expect(await screen.findByText("Unternehmen wurde angelegt.")).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("zeigt eine Fehlermeldung und schließt den Dialog NICHT, wenn das Anlegen fehlschlägt", async () => {
    mockedApiPost.mockRejectedValueOnce(new Error("Name bereits vergeben"));
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ open: true, onClose });

    await user.type(screen.getByLabelText(/^name/i), "Acme GmbH");
    await user.click(screen.getByRole("button", { name: "Unternehmen anlegen" }));

    expect(await screen.findByText("Name bereits vergeben")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("schließt den Dialog beim Klick auf Abbrechen, ohne einen Request zu senden", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ open: true, onClose });

    await user.click(screen.getByRole("button", { name: "Abbrechen" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockedApiPost).not.toHaveBeenCalled();
  });
});
