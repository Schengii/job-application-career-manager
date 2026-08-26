import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("lädt und zeigt die Hauptnavigation zu den Kernbereichen", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    await expect(nav.getByRole("link", { name: "Bewerbungen" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Unternehmen" })).toBeVisible();
  });

  test("navigiert über die Sidebar zur Bewerbungsübersicht", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link", { name: "Bewerbungen" }).click();

    await expect(page).toHaveURL(/\/applications$/);
    await expect(page.getByRole("heading", { name: "Bewerbungen", level: 1 })).toBeVisible();
  });
});
