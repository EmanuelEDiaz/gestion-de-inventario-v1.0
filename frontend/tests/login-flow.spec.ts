import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('http://localhost:3000/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // Fill login form
    await page.getByPlaceholder('Ingresa tu usuario').fill('admin');
    await page.getByPlaceholder('Ingresa tu contraseña').fill('admin123');
    
    // Click login button
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    
    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Verify we're on dashboard
    const url = page.url();
    expect(url).toContain('dashboard');
  });

  test('should handle login/logout cycle', async ({ page }) => {
    // Login
    await page.getByPlaceholder('Ingresa tu usuario').fill('admin');
    await page.getByPlaceholder('Ingresa tu contraseña').fill('admin123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Logout - find and click logout button
    const logoutButton = page.locator('button[title="Cerrar sesión"]');
    await logoutButton.click();
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
  });

  test('should handle multiple login/logout cycles', async ({ page }) => {
    // First login
    await page.getByPlaceholder('Ingresa tu usuario').fill('admin');
    await page.getByPlaceholder('Ingresa tu contraseña').fill('admin123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // First logout
    const logoutButton = page.locator('button[title="Cerrar sesión"]');
    await logoutButton.click();
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
    
    // Wait for state to settle
    await page.waitForTimeout(500);
    
    // Second login - this was the problem case
    await page.getByPlaceholder('Ingresa tu usuario').fill('admin');
    await page.getByPlaceholder('Ingresa tu contraseña').fill('admin123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    expect(page.url()).toContain('dashboard');
  });
});
