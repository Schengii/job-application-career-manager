import { test, expect } from "@playwright/test";

// Deckt gespeicherte Filter-Presets auf der Bewerbungsliste ab (src/lib/savedFilters.ts,
// src/components/applications/saved-filters-bar.tsx): Filter setzen, als benannte Ansicht speichern, als Pill
// wiederfinden, nach einem Reload erneut anwenden und wieder löschen.
test("Ansicht mit aktiven Filtern speichern, erneut anwenden und löschen", async ({ page }) => {
  const unique = Date.now();
  const presetName = `E2E Ansicht ${unique}`;

  await page.goto("/applications");

  // Filter setzen: Status-Chip "Gesendet (Offen)" + Freitextsuche.
  await page.getByRole("tablist", { name: "Nach Status filtern" }).getByRole("tab", { name: /^Gesendet \(Offen\)/ }).click();
  await page.getByPlaceholder("Firma, Position, Tag, Notiz suchen …").fill("E2E");

  // Aktuelle Filterkombination als benannte Ansicht speichern.
  await page.getByRole("button", { name: "Ansicht speichern" }).click();
  await page.getByPlaceholder("Name der Ansicht …").fill(presetName);
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByText(`Ansicht "${presetName}" gespeichert.`)).toBeVisible();

  // Pill mit dem Namen der Ansicht erscheint (kein aria-label auf dem Anwenden-Button — nur ein
  // title-Attribut, s. saved-filters-bar.tsx -, daher über das title-Attribut statt über die Rolle).
  const presetPill = page.locator(`button[title='Ansicht "${presetName}" anwenden']`);
  await expect(presetPill).toBeVisible();

  // Filter zurücksetzen, um sicherzustellen, dass das erneute Anwenden wirklich etwas bewirkt.
  await page.getByRole("button", { name: "Filter zurücksetzen" }).click();
  await expect(page.getByPlaceholder("Firma, Position, Tag, Notiz suchen …")).toHaveValue("");
  await expect(page.getByRole("tablist", { name: "Nach Status filtern" }).getByRole("tab", { name: /^Alle \(/ })).toHaveAttribute(
    "aria-selected",
    "true"
  );

  // Nach einem Reload ist das Preset weiterhin da (localStorage-Persistenz) — erneut anwenden.
  await page.reload();
  const presetPillAfterReload = page.locator(`button[title='Ansicht "${presetName}" anwenden']`);
  await expect(presetPillAfterReload).toBeVisible();
  await presetPillAfterReload.click();

  await expect(page.getByPlaceholder("Firma, Position, Tag, Notiz suchen …")).toHaveValue("E2E");
  await expect(page.getByRole("tablist", { name: "Nach Status filtern" }).getByRole("tab", { name: /^Gesendet \(Offen\)/ })).toHaveAttribute(
    "aria-selected",
    "true"
  );

  // Ansicht löschen (bestätigt über window.confirm).
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Ansicht "${presetName}" löschen` }).click();
  await expect(page.getByRole("button", { name: `Ansicht "${presetName}" anwenden` })).toHaveCount(0);
});
