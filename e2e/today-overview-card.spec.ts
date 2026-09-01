import { test, expect, type Page } from "@playwright/test";

// Deckt die "Heute"-Übersichtskarte auf dem Dashboard ab (src/components/dashboard/today-overview-card.tsx,
// src/lib/todayOverview.ts): rendert auf "/", zeigt ihre drei Tabs (Fällige Aktionen / Anstehende Termine /
// Neue Rückmeldungen) mit den jeweils erwarteten Einträgen, und ein Klick auf einen Eintrag navigiert zur
// richtigen Bewerbungs-Detailseite.

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Legt (analog zu application-lifecycle.spec.ts) eine neue Bewerbung samt neuem Unternehmen an. */
async function createApplication(page: Page, companyName: string, position: string) {
  await page.goto("/applications");
  await page.getByRole("button", { name: "Neue Bewerbung (N)" }).click();

  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neue Bewerbung anlegen")).toBeVisible();

  await page.getByLabel("Unternehmen").selectOption({ label: "+ Neues Unternehmen anlegen" });
  await page.getByLabel("Name des neuen Unternehmens").fill(companyName);
  await page.getByLabel("Position / Jobtitel").fill(position);

  await page.getByRole("button", { name: "Bewerbung anlegen" }).click();
  await expect(page.getByText("Bewerbung wurde angelegt.")).toBeVisible();

  // Reload erzwingt einen frischen GET der (separat von der ungefilterten Liste gecachten)
  // paginierten Tabellen-Ansicht, damit die neu angelegte Zeile garantiert sichtbar ist.
  await page.reload();
  const row = page.getByRole("row").filter({ hasText: companyName });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: "Details" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/);

  const url = page.url();
  const applicationId = url.split("/").pop()!;
  return applicationId;
}

test("Heute-Karte zeigt fällige Aktionen, anstehende Termine und neue Rückmeldungen und verlinkt korrekt", async ({
  page,
}) => {
  // Legt nacheinander drei Bewerbungen an und besucht mehrere Routen (inkl. eines kalten,
  // von Turbopack erst zu kompilierenden Aufrufs von "/") — braucht mehr als das Standard-Timeout.
  test.setTimeout(120_000);
  const unique = Date.now();

  // Route früh einmal aufrufen, damit Turbopack sie im Hintergrund kompiliert, während die
  // Bewerbungen weiter unten angelegt werden — vermeidet einen sehr langsamen kalten
  // Kompilier-Aufruf direkt vor der eigentlichen Prüfung weiter unten.
  await page.goto("/");

  // 1. Bewerbung mit überfälligem Termin (nextStepDate in der Vergangenheit) -> "Fällige Aktionen".
  const overdueCompany = `E2E Heute Überfällig GmbH ${unique}`;
  const overduePosition = `Überfällige Position ${unique}`;
  const overdueId = await createApplication(page, overdueCompany, overduePosition);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await page.getByLabel("Status").selectOption({ label: "Gesendet (Offen)" });
  await page.getByLabel("Termin nächster Schritt").fill(toDateInputValue(yesterday));
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Bewerbung wurde aktualisiert.")).toBeVisible();

  // 2. Bewerbung mit Termin in 3 Tagen -> "Anstehende Termine".
  const upcomingCompany = `E2E Heute Termin GmbH ${unique}`;
  const upcomingPosition = `Anstehende Position ${unique}`;
  const upcomingId = await createApplication(page, upcomingCompany, upcomingPosition);

  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  await page.getByLabel("Status").selectOption({ label: "Gesendet (Offen)" });
  await page.getByLabel("Termin nächster Schritt").fill(toDateInputValue(inThreeDays));
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Bewerbung wurde aktualisiert.")).toBeVisible();

  // 3. Bewerbung, deren Status auf "Vorstellungsgespräch" wechselt -> "Neue Rückmeldungen"
  // (dieselbe Herleitung wie job-application-full-flow.spec.ts).
  const responseCompany = `E2E Heute Rückmeldung GmbH ${unique}`;
  const responsePosition = `Rückmeldungs Position ${unique}`;
  await createApplication(page, responseCompany, responsePosition);

  await page.goto("/applications");
  const responseStatusSelect = page.getByLabel(`Status für ${responsePosition}`);
  await responseStatusSelect.selectOption({ label: "Vorstellungsgespräch" });
  await expect(page.getByText("Status aktualisiert.")).toBeVisible();

  // Dashboard aufrufen und die "Heute"-Karte prüfen. Großzügigerer Timeout, da "/" hier ggf. zum
  // ersten Mal in diesem Testlauf von Turbopack kompiliert wird (kalter Seitenaufruf).
  await page.goto("/");
  // Kein "^"-Anker: Die Überschrift hat ein Icon vor dem Text (siehe
  // today-overview-card.tsx), wodurch der eigentliche Textknoten mit einem Leerzeichen beginnt.
  const heading = page.getByText(/Heute \(\d+\)/);
  await expect(heading).toBeVisible();

  // Auf dem Dashboard tauchen dieselben Firmennamen zusätzlich in "Neueste Bewerbungen" und
  // "Nächste Schritte & Termine" auf -> alle folgenden Prüfungen bewusst auf die "Heute"-Karte
  // selbst beschränkt (eindeutig über ihre in today-overview-card.tsx fest vergebenen
  // Klassen identifizierbar), damit getByText nicht mehrdeutig auf mehrere Elemente trifft.
  const todayCard = page.locator(".border-primary\\/40.bg-primary-soft\\/5");

  // Tab "Fällige Aktionen" explizit anklicken statt auf den initial aktiven Tab zu vertrauen: Da
  // `applications` beim allerersten Render (vor Abschluss des SWR-Fetches) noch leer sein kann,
  // fällt der intern per useState() einmalig gesetzte Default-Tab in diesem Fall auf "Neue
  // Rückmeldungen" zurück (siehe firstNonEmptyTab() in today-overview-card.tsx) und bleibt es auch,
  // nachdem die echten Daten geladen sind (der Lazy-Initializer läuft nur beim Mount).
  const followUpsTab = todayCard.getByRole("button", { name: /^Fällige Aktionen \(\d+\)$/ });
  await expect(followUpsTab).toBeVisible();
  await followUpsTab.click();
  await expect(todayCard.getByText(overdueCompany)).toBeVisible();
  await expect(todayCard.getByText(/Termin überfällig/)).toBeVisible();

  // Tab "Anstehende Termine".
  const interviewsTab = todayCard.getByRole("button", { name: /^Anstehende Termine \(\d+\)$/ });
  await interviewsTab.click();
  await expect(todayCard.getByText(upcomingCompany)).toBeVisible();
  await expect(todayCard.getByText(/in 3 Tagen/)).toBeVisible();

  // Tab "Neue Rückmeldungen".
  const responsesTab = todayCard.getByRole("button", { name: /^Neue Rückmeldungen \(\d+\)$/ });
  await responsesTab.click();
  await expect(todayCard.getByText(responseCompany)).toBeVisible();

  // Klick auf den Rückmeldungs-Eintrag navigiert zur richtigen Bewerbung.
  await todayCard.getByText(responseCompany).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/);
  await expect(page.getByText(responseCompany).first()).toBeVisible();

  // Zurück zum Dashboard und den "Fällige Aktionen"-Eintrag anklicken -> muss zur überfälligen Bewerbung führen.
  await page.goto("/");
  const todayCardAfterReload = page.locator(".border-primary\\/40.bg-primary-soft\\/5");
  await expect(todayCardAfterReload.getByRole("heading", { level: 2 })).toBeVisible();
  const followUpsTabAfterReload = todayCardAfterReload.getByRole("button", { name: /^Fällige Aktionen \(\d+\)$/ });
  await followUpsTabAfterReload.click();
  await expect(todayCardAfterReload.getByText(overdueCompany)).toBeVisible();
  await todayCardAfterReload.getByText(overdueCompany).click();
  await expect(page).toHaveURL(new RegExp(`/applications/${overdueId}$`));

  // Sanity-Check auf die dritte erzeugte Bewerbung (Termin-Tab-Ziel-ID), um sicherzustellen, dass alle drei
  // Bewerbungen tatsächlich unterschiedliche IDs haben (kein Duplikat/Fehl-Match).
  expect(upcomingId).not.toBe(overdueId);
});
