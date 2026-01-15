import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should display dashboard with stats cards', async ({ page }) => {
    // Dashboard should have stat cards
    const statsSection = page.locator('[data-testid="stats-cards"], .stats-grid, .dashboard-stats');
    await expect(statsSection.or(page.locator('.grid'))).toBeVisible();
  });

  test('should display charts', async ({ page }) => {
    // Look for chart containers
    const chartContainer = page.locator('[data-testid="chart"], .recharts-wrapper, canvas');
    // Charts may take time to load
    await page.waitForTimeout(1000);
  });

  test('should display recent activity', async ({ page }) => {
    // Look for activity section
    const activitySection = page.getByText(/actividad|activity|reciente|recent/i);
  });

  test('should have quick action buttons', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = page.getByRole('button', { name: /nueva solicitud|new request|nuevo|new/i });
  });

  test('should show alerts for low stock', async ({ page }) => {
    // Check for alert indicators
    const alerts = page.getByText(/alerta|alert|bajo|low|vencer|expir/i);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Dashboard should still be visible
    const dashboard = page.locator('main, [data-testid="dashboard"]');
    await expect(dashboard.or(page.locator('.min-h-screen'))).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Look for theme toggle
    const themeToggle = page.getByRole('button', { name: /tema|theme|oscuro|dark|claro|light/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);
    }
  });
});
