import { test, expect } from "@playwright/test";

// Deckt das neu hinzugekommene STAR-Methoden-Audit im Interview-Prep-Modul ab
// (src/lib/starAudit.ts, src/components/interview/star-audit-modal.tsx):
// eine Frage im Fragenkatalog aufklappen, das Audit für die hinterlegte
// Musterantwort öffnen und die berechnete Score-/Dimensionsauswertung sehen.
test("STAR-Methoden-Audit öffnet sich aus dem Fragenkatalog und zeigt eine Score-Auswertung", async ({ page }) => {
  await page.goto("/interview-prep");

  // Default-Tab ist der Fragenkatalog ("questions") - erste Frage aufklappen,
  // um den darunterliegenden "STAR-Methoden-Audit"-Button einzublenden.
  const firstQuestionHeader = page.locator("div.cursor-pointer").first();
  await expect(firstQuestionHeader).toBeVisible();
  await firstQuestionHeader.click();

  await page.getByRole("button", { name: "STAR-Methoden-Audit" }).click();

  await expect(page.getByRole("heading", { name: "STAR-Methoden Antwort-Audit" })).toBeVisible();
  await expect(page.getByText(/^Score: \d+\/100 \(.+\)$/)).toBeVisible();

  // Alle vier STAR-Dimensionen (Situation, Task, Action, Result) werden ausgewertet.
  await expect(page.getByText(/\/25 Pkt\.$/)).toHaveCount(4);

  // Optimierte Muster-Antwort lässt sich in die Zwischenablage kopieren.
  await page.getByRole("button", { name: "Kopieren" }).click();
  await expect(page.getByRole("button", { name: "Kopiert" })).toBeVisible();

  await page.getByRole("button", { name: "Verstanden & Schließen" }).click();
  await expect(page.getByRole("heading", { name: "STAR-Methoden Antwort-Audit" })).toHaveCount(0);
});
