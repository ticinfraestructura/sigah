import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible();
    await expect(page.getByLabel(/correo|email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar|login/i })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/correo|email/i).fill('invalid@test.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    await expect(page.getByText(/credenciales|invalid|error/i)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/panel|dashboard/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/correo|email/i).fill('admin@sigah.com');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    await expect(page).toHaveURL('/');

    // Find and click logout
    await page.getByRole('button', { name: /cerrar sesión|logout/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should require email and password', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    // Check for validation messages
    const emailInput = page.getByLabel(/correo|email/i);
    const passwordInput = page.getByLabel(/contraseña|password/i);

    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });
});
