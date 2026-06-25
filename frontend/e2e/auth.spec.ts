import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /SIGAH|iniciar sesión|login/i })).toBeVisible();
    await expect(page.getByLabel(/correo|email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar|iniciar|login/i })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/correo|email/i).fill('invalid@test.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();

    await expect(page.getByText(/credenciales|invalid|error/i)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();

    // Should redirect to dashboard
    await page.waitForURL(/\/$|\/dashboard/);
    await expect(page.getByText(/panel|dashboard/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();

    await page.waitForURL(/\/$|\/dashboard/);

    // Abrir dropdown de usuario (header derecho) y hacer logout
    await page.locator('header button').filter({ hasText: /Admin|Sistema|usuario/i }).first().click();
    await page.waitForTimeout(400);
    await page.getByText('Cerrar sesión').click();
    // Should redirect to login
    await page.waitForURL(/\/login/);
  });

  test('should require email and password', async ({ page }) => {
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();

    const emailInput = page.getByLabel(/correo|email/i);
    const passwordInput = page.getByLabel(/contraseña|password/i);

    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should not allow back-button access to protected pages after logout', async ({ page }) => {
    // Login
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /ingresar|iniciar|login/i }).click();
    await page.waitForURL(/\/$|\/dashboard/);

    // Abrir dropdown de usuario (header derecho) y hacer logout
    await page.locator('header button').filter({ hasText: /Admin|Sistema|usuario/i }).first().click();
    await page.waitForTimeout(400);
    await page.getByText('Cerrar sesión').click();
    await page.waitForURL(/\/login/);

    // Try to go back with browser back button
    await page.goBack();
    await page.waitForTimeout(500);

    // Should still be on login (redirect happened)
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from protected route', async ({ page }) => {
    // Try to access protected route directly without login
    await page.goto('/inventory');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});
