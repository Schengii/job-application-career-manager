import { test, expect } from "@playwright/test";

// Deckt die E-Mail-Antworten-Inbox ab (src/app/api/email-sync/pending/route.ts,
// src/app/inbox/page.tsx): Seite lädt, ein simulierter Sync erzeugt einen Vorschlag (generateSampleInboxEmails()
// in src/lib/emailImapSync.ts matched per Firmennamen auf eine vorhandene Bewerbung), und Annehmen/Ablehnen
// entfernt den Eintrag wieder aus der ausstehenden Liste.
test("Inbox lädt, Sync erzeugt einen Vorschlag, Annehmen entfernt ihn aus der Liste", async ({ page }) => {
  const unique = Date.now();
  const companyName = `E2E Inbox GmbH ${unique}`;
  const position = `E2E Inbox Position ${unique}`;

  // Bewerbung anlegen, gegen die der simulierte E-Mail-Sync matchen kann
  // (generateSampleInboxEmails() baut die Absenderadresse aus dem Firmennamen der ersten Bewerbung).
  await page.goto("/applications");
  await page.getByRole("button", { name: "Neue Bewerbung (N)" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neue Bewerbung anlegen")).toBeVisible();
  await page.getByLabel("Unternehmen").selectOption({ label: "+ Neues Unternehmen anlegen" });
  await page.getByLabel("Name des neuen Unternehmens").fill(companyName);
  await page.getByLabel("Position / Jobtitel").fill(position);
  await page.getByRole("button", { name: "Bewerbung anlegen" }).click();
  await expect(page.getByText("Bewerbung wurde angelegt.")).toBeVisible();

  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "E-Mail-Antworten-Inbox" })).toBeVisible();

  await page.getByRole("button", { name: "Sync starten" }).click();
  await expect(page.getByText("E-Mail-Sync abgeschlossen.")).toBeVisible();

  await expect(page.getByText(`${companyName} – ${position}`)).toBeVisible();

  const acceptButton = page.getByRole("button", { name: "Übernehmen" }).first();
  const rejectButton = page.getByRole("button", { name: "Ablehnen" }).first();
  await expect(acceptButton).toBeVisible();
  await expect(rejectButton).toBeVisible();

  await acceptButton.click();
  await expect(page.getByText("Status übernommen.")).toBeVisible();

  // Der Vorschlag verschwindet aus der ausstehenden Liste.
  await expect(page.getByText(`${companyName} – ${position}`)).toHaveCount(0);

  // Die Bewerbung zeigt nun den übernommenen Status (Vorstellungsgespräch, da die Beispiel-E-Mail eine
  // Einladung zum Vorstellungsgespräch simuliert, siehe generateSampleInboxEmails()).
  await page.goto("/applications");
  await expect(page.getByLabel(`Status für ${position}`)).toHaveValue("INTERVIEW");
});

test("Ablehnen eines Vorschlags entfernt ihn ebenfalls aus der ausstehenden Liste, ohne den Status zu ändern", async ({
  page,
}) => {
  const unique = Date.now();
  const companyName = `E2E Inbox Reject GmbH ${unique}`;
  const position = `E2E Inbox Reject Position ${unique}`;

  await page.goto("/applications");
  await page.getByRole("button", { name: "Neue Bewerbung (N)" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByText("Neue Bewerbung anlegen")).toBeVisible();
  await page.getByLabel("Unternehmen").selectOption({ label: "+ Neues Unternehmen anlegen" });
  await page.getByLabel("Name des neuen Unternehmens").fill(companyName);
  await page.getByLabel("Position / Jobtitel").fill(position);
  await page.getByRole("button", { name: "Bewerbung anlegen" }).click();
  await expect(page.getByText("Bewerbung wurde angelegt.")).toBeVisible();

  await page.goto("/inbox");
  await page.getByRole("button", { name: "Sync starten" }).click();
  await expect(page.getByText("E-Mail-Sync abgeschlossen.")).toBeVisible();
  await expect(page.getByText(`${companyName} – ${position}`)).toBeVisible();

  await page.getByRole("button", { name: "Ablehnen" }).first().click();
  await expect(page.getByText("Vorschlag abgelehnt.")).toBeVisible();
  await expect(page.getByText(`${companyName} – ${position}`)).toHaveCount(0);

  // Status bleibt unverändert (DRAFT, Formular-Default), da der Vorschlag verworfen wurde.
  await page.goto("/applications");
  await expect(page.getByLabel(`Status für ${position}`)).toHaveValue("DRAFT");
});
