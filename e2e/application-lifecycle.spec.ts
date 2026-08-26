import { test, expect } from "@playwright/test";

// Deckt den zentralen Nutzerfluss end-to-end ab: eine neue Bewerbung (samt
// neu angelegtem Unternehmen) über das Formular erfassen, in der Tabelle
// wiederfinden, ihren Status ändern und die Änderung nach einem Seiten-Reload
// (also wirklich aus der Datenbank, nicht nur aus dem Client-State) bestätigt
// sehen.
test("Bewerbung anlegen, in der Tabelle finden und ihren Status ändern", async ({ page }) => {
  const unique = Date.now();
  const companyName = `E2E Test GmbH ${unique}`;
  const position = `E2E Test Position ${unique}`;

  await page.goto("/applications");

  await page.getByRole("button", { name: "Neue Bewerbung (N)" }).click();

  // dialog.tsx setzt kein aria-labelledby, daher hier über das offene
  // native <dialog>-Element statt über getByRole("dialog", { name: ... }).
  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neue Bewerbung anlegen")).toBeVisible();

  await page.getByLabel("Unternehmen").selectOption({ label: "+ Neues Unternehmen anlegen" });
  await page.getByLabel("Name des neuen Unternehmens").fill(companyName);
  await page.getByLabel("Position / Jobtitel").fill(position);

  await page.getByRole("button", { name: "Bewerbung anlegen" }).click();

  // Erfolgs-Toast bestätigt, dass die POST-Requests (Company + Application)
  // durchgelaufen sind, statt nur optimistisch im Formular zu verschwinden.
  await expect(page.getByText("Bewerbung wurde angelegt.")).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: companyName });
  await expect(row).toBeVisible();
  // exact: true, sonst matcht auch das sr-only Label "Status für {position}"
  // der Status-Select-Spalte in derselben Zeile (enthält `position` als Substring).
  await expect(row.getByText(position, { exact: true })).toBeVisible();

  // Neu angelegte Bewerbungen starten im Status "Entwurf" (DRAFT, Formular-Default).
  const statusSelect = page.getByLabel(`Status für ${position}`);
  await expect(statusSelect).toHaveValue("DRAFT");

  await statusSelect.selectOption({ label: "Vorstellungsgespräch" });
  await expect(page.getByText("Status aktualisiert.")).toBeVisible();

  // Reload erzwingt einen frischen GET /api/applications -> bestätigt, dass
  // der neue Status wirklich in der Datenbank persistiert wurde.
  await page.reload();
  await expect(page.getByLabel(`Status für ${position}`)).toHaveValue("INTERVIEW");
});
