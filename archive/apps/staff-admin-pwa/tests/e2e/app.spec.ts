import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:4173/login');
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:4173/login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrong');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});

test.describe('Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4173/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/$/);
  });

  test('should navigate to users page', async ({ page }) => {
    await page.click('text=Users');
    await expect(page).toHaveURL(/.*\/users/);
    await expect(page.locator('h4:has-text("Users")')).toBeVisible();
  });

  test('should open create user dialog', async ({ page }) => {
    await page.goto('http://localhost:4173/users');
    await page.click('text=Add User');
    await expect(page.locator('text=Create User')).toBeVisible();
  });
});

test.describe('Offline Support', () => {
  test('should show offline indicator when network is disabled', async ({ page, context }) => {
    await context.setOffline(true);
    await page.goto('http://localhost:4173/');
    await expect(page.locator('text=You are offline')).toBeVisible();
  });
});
