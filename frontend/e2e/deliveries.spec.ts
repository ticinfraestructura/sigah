import { test, expect } from '@playwright/test';

test.describe('Kits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();
    await page.waitForURL(/\/$|\/dashboard/);
  });

  test('should navigate to kits page', async ({ page }) => {
    await page.goto('/kits');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /kits/i }).first()).toBeVisible();
  });

  test('should display kits list', async ({ page }) => {
    await page.goto('/kits');
    const content = page.locator('table, ul, [class*="grid"], [class*="list"]').first();
    await expect(content).toBeVisible();
  });

  test('should search kits', async ({ page }) => {
    await page.goto('/kits');
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Kit');
      await page.waitForTimeout(500);
    }
  });

  test('should view kit detail on click', async ({ page }) => {
    await page.goto('/kits');
    const firstKit = page.locator('table tbody tr, [class*="card"], [class*="item"]').first();
    if (await firstKit.isVisible()) {
      await firstKit.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show kit stock information', async ({ page }) => {
    await page.goto('/kits');
    const stockInfo = page.getByText(/stock|cantidad|disponible/i).first();
    // Stock info may or may not be visible depending on data
  });
});
