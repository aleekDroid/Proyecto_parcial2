import { test, expect } from '@playwright/test';

test.describe('Suite E2E - React Frontend, Autenticación y CRUD de Usuarios', () => {

  test('Debe verificar que la API de Healthcheck responda correctamente', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('UP');
  });

  test('El registro crea una cuenta de usuario sin acceso a la administración', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-register').click();

    const testEmail = `react_user_${Date.now()}@example.com`;
    await page.getByTestId('input-register-name').fill('Usuario React E2E');
    await page.getByTestId('input-register-email').fill(testEmail);
    await page.getByTestId('input-register-password').fill('Password123!');
    await page.getByTestId('btn-register-submit').click();

    await expect(page.getByTestId('user-welcome')).toContainText('Usuario React E2E');
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page.getByTestId('tab-crud')).toHaveCount(0);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const usersResponse = await page.request.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(usersResponse.status()).toBe(403);
  });

  test('Debe permitir Iniciar Sesión con credenciales existentes', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-login-email').fill('admin@example.com');
    await page.getByTestId('input-login-password').fill('admin123');
    await page.getByTestId('btn-login-submit').click();

    await expect(page.getByTestId('user-welcome')).toContainText('Admin System');
  });

  test('Debe ejecutar operaciones CRUD (Crear, Editar y Eliminar Usuario)', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-login-email').fill('admin@example.com');
    await page.getByTestId('input-login-password').fill('admin123');
    await page.getByTestId('btn-login-submit').click();

    const createdEmail = `crud_user_${Date.now()}@example.com`;
    await page.getByTestId('tab-crud').click();
    await page.getByTestId('btn-open-user-form').click();
    await page.getByTestId('input-user-name').fill('Usuario CRUD Inicial');
    await page.getByTestId('input-user-email').fill(createdEmail);
    await page.getByTestId('input-user-password').fill('CrudPass123');
    await page.getByTestId('btn-save-user').click();

    await expect(page.getByTestId('users-table')).toContainText('Usuario CRUD Inicial');

    const lastEditBtn = page.locator('button[data-testid^="btn-edit-user-"]').last();
    await lastEditBtn.click();

    await page.getByTestId('input-user-name').fill('Usuario CRUD Modificado');
    await page.getByTestId('btn-save-user').click();

    await expect(page.getByTestId('users-table')).toContainText('Usuario CRUD Modificado');

    const lastDeleteBtn = page.locator('button[data-testid^="btn-delete-user-"]').last();
    await lastDeleteBtn.click();
  });

  test('Debe responder con un error HTTP 500 en el endpoint de diagnóstico', async ({ request }) => {
    const response = await request.get('/api/error-simulation');
    expect(response.status()).toBe(500);
    const body = await response.json();
    expect(body.error.message).toContain('Simulación intencional de falla interna');
  });

});
