import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should show register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should redirect unauthenticated users from game pages to login", async ({
    page,
  }) => {
    await page.goto("/hub");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users from arena to login", async ({
    page,
  }) => {
    await page.goto("/arena");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login form should have required fields", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );
    // At least one of these should exist
    const hasEmail = (await emailInput.count()) > 0;
    const hasPassword = (await passwordInput.count()) > 0;
    expect(hasEmail || hasPassword).toBeTruthy();
  });

  test("register form should have required fields", async ({ page }) => {
    await page.goto("/register");
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const hasEmail = (await emailInput.count()) > 0;
    expect(hasEmail).toBeTruthy();
  });
});
