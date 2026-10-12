import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('el resumen permite elegir un rango de meses a gusto, y «Desde» nunca pasa de «Hasta»', async ({ page }) => {
  await login(page, ADMIN);
  await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible();
  await page.getByLabel('Período').selectOption({ label: 'Otro rango…' });
  await expect(page.getByLabel('Desde')).toBeVisible();

  const request = page.waitForRequest(r => r.url().includes('/dashboard') && r.url().includes('from=2026-07') && r.url().includes('to=2026-08'));
  await page.getByLabel('Desde').selectOption({ label: 'Julio 2026' });
  await page.getByLabel('Hasta').selectOption({ label: 'Agosto 2026' });
  await request; // la consulta salió con el rango elegido

  await page.getByLabel('Desde').selectOption({ label: 'Septiembre 2026' }); // pasa de «Hasta»: este se mueve con él
  await expect(page.getByLabel('Hasta').locator('option:checked')).toHaveText('Septiembre 2026');
  await page.getByLabel('Hasta').selectOption({ label: 'Julio 2026' });       // y al revés
  await expect(page.getByLabel('Desde').locator('option:checked')).toHaveText('Julio 2026');
});
