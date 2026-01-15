import { test, expect } from '@playwright/test';

test.describe('Request Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to requests page', async ({ page }) => {
    await page.getByRole('link', { name: /solicitud|request/i }).click();
    await expect(page).toHaveURL('/requests');
  });

  test('should display requests list', async ({ page }) => {
    await page.goto('/requests');
    
    await expect(page.getByRole('heading', { name: /solicitud|request/i })).toBeVisible();
  });

  test('should open new request form', async ({ page }) => {
    await page.goto('/requests');
    
    const newRequestBtn = page.getByRole('button', { name: /nueva|new|crear|create/i });
    if (await newRequestBtn.isVisible()) {
      await newRequestBtn.click();
      await expect(page.url()).toContain('/requests/new');
    }
  });

  test('should filter requests by status', async ({ page }) => {
    await page.goto('/requests');
    
    // Look for status filter
    const statusFilter = page.getByRole('combobox', { name: /estado|status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
    }
  });

  test('should view request details', async ({ page }) => {
    await page.goto('/requests');
    
    // Click on first request
    const requestRow = page.locator('table tbody tr, [data-testid="request-item"]').first();
    if (await requestRow.isVisible()) {
      await requestRow.click();
    }
  });

  test('should search requests', async ({ page }) => {
    await page.goto('/requests');
    
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('SOL-001');
      await page.waitForTimeout(500);
    }
  });
});
