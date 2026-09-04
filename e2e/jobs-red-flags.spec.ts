import { test, expect } from "@playwright/test";

// Deckt den Arbeitgeber-Audit & Benefit-Scanner ab (src/lib/jobRedFlags.ts,
// job-red-flags-card.tsx): eine über die API angelegte Stellenanzeige mit
// bekannten Warnsignal- und Positiv-Formulierungen zeigt die entsprechende
// Karte mit Score sowie den erkannten Rot-/Grün-Flags auf /jobs.
test("Arbeitgeber-Audit erkennt Warnsignale und positive Signale in der Stellenbeschreibung", async ({
  page,
  request,
}) => {
  const unique = Date.now();
  const jobTitle = `E2E Red-Flags Job ${unique}`;

  const res = await request.post("/api/jobs", {
    data: {
      title: jobTitle,
      // "Familie" triggert das Warnsignal "Familiäre Atmosphäre", "100%
      // Remote" und "Weiterbildungsbudget" triggern zwei positive Signale
      // (s. src/lib/jobRedFlags.ts).
      description:
        "Wir sind eine Familie und suchen dich als Verstärkung. 100% Remote möglich, dazu ein großzügiges Weiterbildungsbudget.",
      portalSource: "STEPSTONE",
      companyName: `E2E Red-Flags GmbH ${unique}`,
    },
  });
  expect(res.ok()).toBeTruthy();

  await page.goto("/jobs");

  const jobCard = page.getByText(jobTitle).locator("xpath=ancestor::div[contains(@class,'card-hover-effect')]");
  await expect(jobCard).toBeVisible();

  await expect(jobCard.getByText("Arbeitgeber-Audit & Benefit-Scanner")).toBeVisible();
  await expect(jobCard.getByText(/Attraktivitäts-Score: \d+\/100/)).toBeVisible();
  await expect(jobCard.getByText("Familiäre Atmosphäre / Wir sind eine Familie")).toBeVisible();
  await expect(jobCard.getByText("100% Remote / Freie Wohnortwahl")).toBeVisible();
});
