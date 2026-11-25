import { test, expect } from '@playwright/test';

test.describe('Escenario de Prueba de Bloqueo del Pipeline (Fallo Intencional)', () => {

  test('Verificación de control de fallos en Pipeline CI/CD', async ({ page }) => {
    await page.goto('/');

    if (process.env.FAIL_PIPELINE === 'true') {
      console.warn('⚠️ Se activó la variable FAIL_PIPELINE=true. Forzando fallo intencional de Playwright...');
      expect(true).toBe(false);
    } else {
      console.log('✅ Ejecución normal de prueba de control: El sistema opera correctamente.');
      const statusBadge = page.getByTestId('sys-status');
      await expect(statusBadge).toBeVisible();
    }
  });

});
