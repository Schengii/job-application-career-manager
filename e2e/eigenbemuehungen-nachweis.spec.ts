import { test, expect } from "@playwright/test";

// Deckt den Nachweis von Eigenbemühungen ab (§ 38 SGB III, src/lib/eigenbemuehungenReport.ts,
// eigenbemuehungen-modal.tsx): eine Bewerbung mit Bewerbungsdatum im aktuellen
// Monat erscheint in der Monatsübersicht des Nachweis-Modals und aktiviert
// den Drucken-Button.
test("Bewerbung mit Datum im aktuellen Monat erscheint im Eigenbemühungen-Nachweis", async ({ page }) => {
  const unique = Date.now();
  const companyName = `E2E Eigenbemühungen GmbH ${unique}`;
  const position = `E2E Eigenbemühungen Position ${unique}`;

  await page.goto("/applications");
  await page.getByRole("button", { name: "Neue Bewerbung (N)" }).click();

  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neue Bewerbung anlegen")).toBeVisible();
  await page.getByLabel("Unternehmen").selectOption({ label: "+ Neues Unternehmen anlegen" });
  await page.getByLabel("Name des neuen Unternehmens").fill(companyName);
  await page.getByLabel("Position / Jobtitel").fill(position);
  await page.getByRole("button", { name: "Bewerbung anlegen" }).click();
  await expect(page.getByText("Bewerbung wurde angelegt.")).toBeVisible();

  // Bewerbungsdatum auf heute setzen — neu angelegte Bewerbungen starten ohne
  // Datum (Status DRAFT, s. application-lifecycle.spec.ts), der Nachweis
  // filtert aber ausschließlich nach `applicationDate` (s. filterApplicationsByPeriod).
  const row = page.getByRole("row").filter({ hasText: companyName });
  await row.getByRole("link", { name: "Details" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/);

  const todayInputValue = new Date().toISOString().slice(0, 10);
  await page.getByLabel("Bewerbungsdatum").fill(todayInputValue);
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Bewerbung wurde aktualisiert.")).toBeVisible();

  await page.goto("/applications");
  await page.getByRole("button", { name: "Nachweis Arbeitsamt (§ 38)" }).click();

  await expect(page.getByRole("heading", { name: "Nachweis von Eigenbemühungen (§ 38 / § 159 SGB III)" })).toBeVisible();
  // Default-Monat ist der aktuelle Monat (currentMonthStr) - die soeben
  // gesetzte Bewerbung muss also ohne weitere Interaktion sichtbar sein.
  // .first(): der Firmenname taucht sowohl in der Bewerbungs-Übersichtsliste
  // des Modals als auch (dahinter) in der Bewerbungstabelle auf.
  await expect(page.getByText(companyName).first()).toBeVisible();
  await expect(page.getByText(position).first()).toBeVisible();

  // "Drucken / PDF speichern" ist nur aktiv, wenn mind. eine Bewerbung im
  // gewählten Zeitraum erfasst wurde.
  await expect(page.getByRole("button", { name: /Drucken \/ PDF speichern/ })).toBeEnabled();
});
