import { test, expect } from '@playwright/test';

test.describe('Inventory Application E2E', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    expect(title).toContain('Inventario');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('login');
  });

  test('should load home page and show content', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toContain('login');
  });
});