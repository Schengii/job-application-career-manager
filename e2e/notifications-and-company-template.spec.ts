import { test, expect } from "@playwright/test";

// Deckt zwei der zuletzt gemergten Features end-to-end ab (Branch
// feat/notifications-match-filter-company-templates):
//  1. Statuswechsel-Benachrichtigungen (src/lib/notifications.ts,
//     NotificationBell): eine Bewerbung auf "Vorstellungsgespräch" setzen und
//     die daraus abgeleitete Benachrichtigung in der Glocke sehen, ausblenden
//     und ihr dauerhaftes Verschwinden (auch nach Reload) bestätigen.
//  2. Unternehmensspezifischer Anschreiben-Einleitungssatz
//     (Company.letterTemplate, company-info-card.tsx): am Unternehmen einer
//     Bewerbung hinterlegen und den Hinweis "Eigener Einleitungssatz
//     hinterlegt" in der (nicht editierenden) Kartenansicht bestätigt sehen.
test("Statuswechsel löst Benachrichtigung aus + eigener Anschreiben-Einleitungssatz am Unternehmen", async ({
  page,
}) => {
  const unique = Date.now();
  const companyName = `E2E Notify GmbH ${unique}`;
  const position = `E2E Notify Position ${unique}`;

  await page.goto("/applications");
  await page.getByRole("button", { name: "Neue Bewerbung (N)" }).click();

  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neue Bewerbung anlegen")).toBeVisible();
  await page.getByLabel("Unternehmen").selectOption({ label: "+ Neues Unternehmen anlegen" });
  await page.getByLabel("Name des neuen Unternehmens").fill(companyName);
  await page.getByLabel("Position / Jobtitel").fill(position);
  await page.getByRole("button", { name: "Bewerbung anlegen" }).click();
  await expect(page.getByText("Bewerbung wurde angelegt.")).toBeVisible();

  // Status auf "Vorstellungsgespräch" setzen -> erzeugt ein ApplicationStatusEvent,
  // aus dem getNotificationsFromApplications() eine INTERVIEW-Benachrichtigung ableitet.
  const statusSelect = page.getByLabel(`Status für ${position}`);
  await statusSelect.selectOption({ label: "Vorstellungsgespräch" });
  await expect(page.getByText("Status aktualisiert.")).toBeVisible();

  // Benachrichtigungs-Glocke öffnen und den neuen Eintrag prüfen. Der Name
  // enthält bewusst den (per Timestamp eindeutigen) Firmennamen - die
  // Testsuite teilt sich eine DB über alle Specs hinweg, andere Tests legen
  // ebenfalls INTERVIEW-Benachrichtigungen an, ein reiner Titel-Match wäre
  // also mit fortschreitender Suite nicht mehr eindeutig.
  const bellButton = page.getByRole("button", { name: "Benachrichtigungen" });
  await bellButton.click();
  // Die gesamte Notification-Zeile ist ein <Link> (s. NotificationBell) mit
  // Firma, Titel & Nachricht als zusammengesetztem Accessible Name.
  const notificationLink = page.getByRole("link", { name: new RegExp(`${companyName}.*Einladung zum Vorstellungsgespräch`) });
  await expect(notificationLink).toBeVisible();

  // Einzeln ausblenden: der "Ausblenden"-Button ist im DOM ein Geschwister
  // des Link-umschließenden Wrapper-Divs, nicht des Links selbst (s.
  // notification-bell.tsx) - daher gezielt über XPath vom Link-Elternteil
  // zum nächsten Geschwister-Button statt über eine feste Anzahl ".."-Sprünge.
  const dismissButton = notificationLink.locator("xpath=../following-sibling::button[@title='Ausblenden']");
  await dismissButton.click();
  await expect(notificationLink).toHaveCount(0);

  // Ausblenden ist dauerhaft (localStorage) - bleibt auch nach Reload verschwunden.
  await page.reload();
  await bellButton.click();
  await expect(notificationLink).toHaveCount(0);

  // Zur Bewerbung navigieren und am verknüpften Unternehmen den eigenen
  // Anschreiben-Einleitungssatz hinterlegen.
  const row = page.getByRole("row").filter({ hasText: companyName });
  await row.getByRole("link", { name: "Details" }).click();
  await expect(page).toHaveURL(/\/applications\/[^/]+$/);

  await page.getByRole("button", { name: "Unternehmen bearbeiten" }).click();
  const openingSentence = "Ihre Mission, nachhaltige Software zu bauen, hat mich sofort überzeugt.";
  await page.getByLabel(/Eigener Einleitungssatz fürs Anschreiben/).fill(openingSentence);
  // exact: true, sonst matcht auch "Änderungen speichern" des daneben
  // sichtbaren Bewerbungsdetails-Formulars auf derselben Seite.
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Unternehmen wurde aktualisiert.")).toBeVisible();

  await expect(page.getByText("Eigener Einleitungssatz hinterlegt")).toBeVisible();
});
