import { test, expect } from "@playwright/test";

// Deckt den Match-Score-Filter auf /jobs ab (src/lib/matching.ts,
// src/app/jobs/page.tsx): Jobs werden bewusst direkt über die API angelegt
// (statt über den Multi-Portal-Sync/Live-Suche-UI-Flow, der echte externe
// Portale abfragt) — so bleibt der Test deterministisch und unabhängig von
// externen Diensten, deckt aber die eigentlich zu prüfende Logik (Filter-
// Dropdown blendet nach berechnetem Match-Score korrekt ein/aus) vollständig ab.
test("Match-Score-Filter blendet Jobs nach berechnetem Score korrekt ein und aus", async ({ page, request }) => {
  const unique = Date.now();
  const highMatchTitle = `Fachinformatiker für Anwendungsentwicklung Frontend ${unique}`;
  const lowMatchTitle = `COBOL Mainframe Systemprogrammierer ${unique}`;

  // Hoher Match: Tech-Stack, Rolle und Standort treffen exakt die Default-
  // Präferenzen (Preferences wird beim ersten Zugriff mit sinnvollen Defaults
  // angelegt, siehe src/lib/preferences.ts::getOrCreatePreferences).
  const highMatchRes = await request.post("/api/jobs", {
    data: {
      title: highMatchTitle,
      description: "Wir suchen einen Frontend-Entwickler mit React- und TypeScript-Erfahrung.",
      portalSource: "STEPSTONE",
      location: "Bonn",
      remote: false,
      requirementsProfile: "TypeScript, React, Next.js, CSS, HTML, JavaScript",
      techStack: "TypeScript,JavaScript,CSS,React,Next.js,HTML",
      companyName: `E2E High Match GmbH ${unique}`,
    },
  });
  expect(highMatchRes.ok()).toBeTruthy();

  // Niedriger Match: weder Tech-Stack noch Standort noch Rolle passen zu den
  // Default-Präferenzen.
  const lowMatchRes = await request.post("/api/jobs", {
    data: {
      title: lowMatchTitle,
      description: "Batch-Verarbeitung und Wartung auf Großrechnern.",
      portalSource: "STEPSTONE",
      location: "München",
      remote: false,
      requirementsProfile: "COBOL, AS400, JCL",
      techStack: "COBOL,AS400,JCL",
      companyName: `E2E Low Match GmbH ${unique}`,
    },
  });
  expect(lowMatchRes.ok()).toBeTruthy();

  await page.goto("/jobs");

  const highMatchCard = page.getByText(highMatchTitle);
  const lowMatchCard = page.getByText(lowMatchTitle);

  // "Jeder Match-Score" (Default) -> beide sichtbar.
  await expect(highMatchCard).toBeVisible();
  await expect(lowMatchCard).toBeVisible();

  // "Top Matches (≥ 75%)" -> nur der hohe Match bleibt sichtbar.
  await page.getByRole("combobox").filter({ hasText: "Jeder Match-Score" }).selectOption({ label: "Top Matches (≥ 75%)" });
  await expect(highMatchCard).toBeVisible();
  await expect(lowMatchCard).toHaveCount(0);

  // Zurück auf "Jeder Match-Score" -> beide wieder sichtbar.
  await page.getByRole("combobox").filter({ hasText: "Top Matches" }).selectOption({ label: "Jeder Match-Score" });
  await expect(lowMatchCard).toBeVisible();
});
