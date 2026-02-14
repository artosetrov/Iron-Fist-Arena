import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("home page should load within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("login page should load within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("should not have console errors on home page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (e.g., missing images in dev)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Failed to load resource") &&
        !e.includes("favicon") &&
        !e.includes("404"),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
