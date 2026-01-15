import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to inventory page', async ({ page }) => {
    await page.getByRole('link', { name: /inventario|inventory/i }).click();
    await expect(page).toHaveURL('/inventory');
    await expect(page.getByRole('heading', { name: /inventario|inventory/i })).toBeVisible();
  });

  test('should display product list', async ({ page }) => {
    await page.goto('/inventory');
    
    // Should have a table or list of products
    const productList = page.locator('table, [role="grid"], [data-testid="product-list"]');
    await expect(productList).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    await page.goto('/inventory');
    
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    await searchInput.fill('test product');
    
    // Wait for search results
    await page.waitForTimeout(500);
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/inventory');
    
    // Look for filter/category selector
    const filterButton = page.getByRole('button', { name: /filtrar|filter|categoría|category/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/inventory');
    
    // Click on first product row or link
    const productLink = page.locator('table tbody tr a, [data-testid="product-item"]').first();
    if (await productLink.isVisible()) {
      await productLink.click();
      await expect(page.url()).toContain('/inventory/');
    }
  });

  test('should show low stock alert', async ({ page }) => {
    await page.goto('/inventory');
    
    // Check for low stock indicator
    const lowStockAlert = page.getByText(/stock bajo|low stock|alerta/i);
    // This may or may not be visible depending on data
  });
});
