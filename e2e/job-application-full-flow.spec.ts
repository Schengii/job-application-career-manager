import { test, expect } from "@playwright/test";

// Deckt den vollständigen End-to-End-Fluss ab, der die zentralen Features der
// letzten Ausbaustufe (Jobsuche-Sync, Ein-Klick-Bewerben mit automatischem
// Standardpaket, Status-Änderung, Dashboard-Rückmeldungen) miteinander
// verknüpft — ergänzend zu application-lifecycle.spec.ts (manuell angelegte
// Bewerbung) und company-management.spec.ts.
test("Job synchronisieren, bewerben, automatisches Anschreiben prüfen und Statuswechsel im Dashboard sehen", async ({
  page,
}) => {
  await page.goto("/jobs");

  // Mock-Jobportale abgleichen, damit die (in der frischen E2E-DB leere)
  // Jobliste befüllt wird — siehe src/lib/mockJobPortals.ts.
  await page.getByRole("button", { name: "Jetzt alle Portale abgleichen" }).click();
  await expect(page.getByText(/neue Stellenangebote von allen \d+ Jobportalen geladen|sind aktuell/)).toBeVisible({
    timeout: 15_000,
  });

  const applyButtons = page.getByRole("button", { name: "Direkt bewerben" });
  await expect(applyButtons.first()).toBeVisible();
  await applyButtons.first().click();

  // Der Klick legt eine DRAFT-Bewerbung an, hängt automatisch alle
  // Standard-Dokumente an und generiert ein Anschreiben (siehe
  // ensureStandardPackage() in src/app/api/jobs/[id]/apply/route.ts) —
  // danach Redirect auf die Detailseite.
  await expect(page.getByText("Bewerbung wurde als Entwurf angelegt.")).toBeVisible();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/);

  // "Neu generieren" statt "Anschreiben generieren" bestätigt, dass das
  // automatische Anschreiben wirklich vorhanden ist, nicht nur der
  // Datensatz angelegt wurde.
  await expect(page.getByRole("button", { name: "Neu generieren" })).toBeVisible();

  const position = await page.locator("h1").first().innerText();

  // Statuswechsel auf "Vorstellungsgespräch" über die Kanban/Tabellen-Ansicht
  // (dieselbe Interaktion wie application-lifecycle.spec.ts), um die
  // Dashboard-Rückmeldungskarte (recent-responses-card.tsx) auszulösen.
  await page.goto("/applications");
  const statusSelect = page.getByLabel(`Status für ${position}`);
  await statusSelect.selectOption({ label: "Vorstellungsgespräch" });
  await expect(page.getByText("Status aktualisiert.")).toBeVisible();

  // Die "Heute"-Karte fasst u.a. neue Rückmeldungen zusammen (siehe
  // today-overview-card.tsx) — der Positionstitel taucht auf dem Dashboard
  // bewusst zusätzlich in "Neueste Bewerbungen" auf, daher hier gezielt auf
  // die Heute-Karte scopen statt global auf den Text zu prüfen.
  await page.goto("/");
  const todayCard = page.getByTestId("today-overview-card");
  await todayCard.getByRole("button", { name: /Neue Rückmeldungen/ }).click();
  await expect(todayCard.getByText(position, { exact: true })).toBeVisible();
});
