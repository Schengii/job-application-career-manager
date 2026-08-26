import { test, expect } from "@playwright/test";

// Deckt den zweiten zentralen Nutzerfluss end-to-end ab (ergänzend zu
// application-lifecycle.spec.ts): ein Unternehmen anlegen, es über die
// Freitext-Suche wiederfinden und über die Kartenliste in die Detailansicht
// navigieren.
test("Unternehmen anlegen, per Suche filtern und in die Detailansicht navigieren", async ({ page }) => {
  const unique = Date.now();
  const companyName = `E2E Company Management GmbH ${unique}`;
  const city = "Bonn";

  await page.goto("/companies");

  await page.getByRole("button", { name: "Neues Unternehmen" }).click();

  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neues Unternehmen anlegen")).toBeVisible();

  await page.getByLabel(/^name/i).fill(companyName);
  await page.getByLabel(/^stadt/i).fill(city);
  await page.getByRole("button", { name: "Unternehmen anlegen" }).click();

  await expect(page.getByText("Unternehmen wurde angelegt.")).toBeVisible();

  const card = page.getByRole("link", { name: new RegExp(companyName) });
  await expect(card).toBeVisible();
  // Ohne Filter angelegte Unternehmen starten im Status "Lead" (Formular-Default).
  await expect(card.getByText("Lead")).toBeVisible();

  // Freitext-Suche filtert auf genau diese eine Karte herunter.
  await page.getByPlaceholder("Unternehmen, Ort, Kontakt suchen …").fill(companyName);
  await expect(page.getByText(/^1 von \d+ Firmen$/)).toBeVisible();
  await expect(card).toBeVisible();

  await card.click();
  await expect(page).toHaveURL(/\/companies\/[^/]+$/);
  await expect(page.getByText(companyName)).toBeVisible();
});
