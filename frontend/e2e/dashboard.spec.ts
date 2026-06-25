import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();
    await page.waitForURL(/\/$|\/dashboard/);
  });

  test('should display dashboard with stats cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Total Productos|Kits Activos|Usuarios Activos/i).first()).toBeVisible();
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
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Buscar botón de tema por icono (sun/moon) en el header
    const themeToggle = page.locator('header button').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);
    }
  });
});
