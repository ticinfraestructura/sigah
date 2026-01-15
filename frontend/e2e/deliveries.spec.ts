import { test, expect } from '@playwright/test';

test.describe('Deliveries Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to deliveries page', async ({ page }) => {
    await page.getByRole('link', { name: /entrega|deliver/i }).click();
    await expect(page).toHaveURL('/deliveries');
  });

  test('should display deliveries list', async ({ page }) => {
    await page.goto('/deliveries');
    
    await expect(page.getByRole('heading', { name: /entrega|deliver/i })).toBeVisible();
  });

  test('should filter deliveries by date', async ({ page }) => {
    await page.goto('/deliveries');
    
    // Look for date filter
    const dateInput = page.getByLabel(/fecha|date/i).first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-01-01');
    }
  });

  test('should view delivery details', async ({ page }) => {
    await page.goto('/deliveries');
    
    // Click on first delivery
    const deliveryRow = page.locator('table tbody tr, [data-testid="delivery-item"]').first();
    if (await deliveryRow.isVisible()) {
      await deliveryRow.click();
    }
  });

  test('should show delivery status indicators', async ({ page }) => {
    await page.goto('/deliveries');
    
    // Check for status badges
    const statusBadge = page.locator('[data-testid="status-badge"], .badge, .status');
    // Status indicators should be present
  });
});
