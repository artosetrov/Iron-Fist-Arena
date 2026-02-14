import { test, expect } from "@playwright/test";

test.describe("Navigation & Pages", () => {
  test("home page should load", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Iron Fist Arena/);
  });

  test("404 page should render for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("login page should load without errors", async ({ page }) => {
    await page.goto("/login");
    // Should not show error boundary
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
  });

  test("register page should load without errors", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
  });
});
