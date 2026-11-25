import { test, expect } from '@playwright/test';

test.describe('Suite E2E - Aplicación y Observabilidad', () => {

  test('Debe verificar que la API de Healthcheck responda correctamente', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('UP');
    expect(body.timestamp).toBeDefined();
  });

  test('Debe cargar la interfaz web y listar los elementos iniciales', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('sys-status')).toHaveText('ONLINE');
    const itemsList = page.getByTestId('items-list');
    await expect(itemsList).toBeVisible();
    await expect(itemsList.locator('li')).toHaveCount(3);
  });

  test('Debe permitir registrar un nuevo recurso y reflejarlo en la UI', async ({ page }) => {
    await page.goto('/');
    const newItemName = `EC2 Node Monitor ${Date.now()}`;

    await page.getByTestId('input-item-name').fill(newItemName);
    await page.getByTestId('btn-add-item').click();

    await expect(page.getByTestId('items-list')).toContainText(newItemName);
  });

  test('Debe manejar adecuadamente los errores HTTP 500 y mostrar el mensaje en UI', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('btn-simulate-error').click();

    const errorBox = page.getByTestId('error-message');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText('Simulación intencional de falla interna en backend');
  });

});
