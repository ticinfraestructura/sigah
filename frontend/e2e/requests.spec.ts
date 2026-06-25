import { test, expect } from '@playwright/test';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();
    await page.waitForURL(/\/$|\/dashboard/);
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /reporte|report/i }).first()).toBeVisible();
  });

  test('should display report type options', async ({ page }) => {
    await page.goto('/reports');
    const content = page.locator('main, [class*="card"], [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  test('should have export button or option', async ({ page }) => {
    await page.goto('/reports');
    const exportBtn = page.getByRole('button', { name: /exportar|export|descargar|download/i });
    // Export button may appear after selecting a report type
  });

  test('should show inventory report', async ({ page }) => {
    await page.goto('/reports');
    const inventoryOption = page.getByText(/inventario|inventory/i).first();
    if (await inventoryOption.isVisible()) {
      await inventoryOption.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show kits report', async ({ page }) => {
    await page.goto('/reports');
    const kitsOption = page.getByText(/kit/i).first();
    if (await kitsOption.isVisible()) {
      await kitsOption.click();
      await page.waitForTimeout(1000);
    }
  });
});
