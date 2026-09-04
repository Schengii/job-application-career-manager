import { test, expect } from "@playwright/test";

// Deckt den Interview-/Termin-Kalender ab (src/app/calendar/page.tsx,
// InteractiveCalendar): ein Termin ("Nächster Schritt & Datum") an einer
// Bewerbung erscheint in der Agenda-Ansicht und lässt sich von dort zur
// Bewerbung zurückverfolgen; das Kalender-Abo-Modal zeigt eine ics-Feed-URL.
test("Termin einer Bewerbung erscheint im Kalender und Abo-Modal zeigt die Feed-URL", async ({ page }) => {
  const unique = Date.now();
  const companyName = `E2E Kalender GmbH ${unique}`;
  const position = `E2E Kalender Position ${unique}`;

  await page.goto("/applications");
  await page.getByRole("button", { name: "Neue Bewerbung (N)" }).click();

  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neue Bewerbung anlegen")).toBeVisible();
  await page.getByLabel("Unternehmen").selectOption({ label: "+ Neues Unternehmen anlegen" });
  await page.getByLabel("Name des neuen Unternehmens").fill(companyName);
  await page.getByLabel("Position / Jobtitel").fill(position);
  await page.getByRole("button", { name: "Bewerbung anlegen" }).click();
  await expect(page.getByText("Bewerbung wurde angelegt.")).toBeVisible();

  // Zur Detailseite navigieren und einen Termin für heute eintragen -
  // "heute" garantiert Sichtbarkeit in der Agenda-Ansicht ohne Monatsnavigation
  // (upcomingEvents filtert auf `date >= heute 00:00`, s. interactive-calendar.tsx).
  const row = page.getByRole("row").filter({ hasText: companyName });
  await row.getByRole("link", { name: "Details" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/);

  const todayInputValue = new Date().toISOString().slice(0, 10);
  await page.getByLabel("Termin nächster Schritt").fill(todayInputValue);
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Bewerbung wurde aktualisiert.")).toBeVisible();

  await page.goto("/calendar");
  await page.getByRole("button", { name: /^Agenda \(\d+\)$/ }).click();

  const agendaEntry = page.getByRole("link", { name: companyName });
  await expect(agendaEntry).toBeVisible();
  await agendaEntry.click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/);
  await expect(page.getByText(companyName).first()).toBeVisible();

  // Kalender-Abo-Modal: zeigt eine ics-Feed-URL zum Kopieren/Abonnieren.
  await page.goto("/calendar");
  await page.getByRole("button", { name: "Kalender abonnieren (.ics)" }).click();
  await expect(page.getByRole("heading", { name: "Live-Kalender-Abonnement" })).toBeVisible();
  // Feed-URL steckt in einem readonly-<input> (Label ist nicht mit
  // htmlFor/id verknüpft, daher kein getByLabel) - über den Wert statt
  // getByText auslesen.
  await expect(page.locator('input[readonly]')).toHaveValue(/\/api\/calendar\/feed\.ics$/);
});
