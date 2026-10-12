import { expect, test } from '@playwright/test';
import { ADMIN, COORD, login, tab } from './helpers';

test('si otra persona guarda un cambio, el cuadro abierto se actualiza solo y avisa', async ({ page, browser }) => {
  // La administradora abre el cuadro en borrador de la UCI…
  await login(page, ADMIN);
  await tab(page, 'Cuadros').click();
  await page.locator('.qc:not(.new)', { hasText: 'Borrador' }).filter({ hasText: 'UCI Neurocrítica' }).first().click();
  await expect(page.locator('table.g button[data-p]').first()).toBeVisible();
  const url = page.url();
  // Una casilla que nadie ha fijado (no vacaciones ni nada pintado a mano)
  const free = page.locator('table.g button[data-p]:not(.lk)').nth(40);
  const cell = `table.g button[data-p="${await free.getAttribute('data-p')}"][data-d="${await free.getAttribute('data-d')}"]`;
  const cellA = page.locator(cell);
  await expect(cellA).not.toHaveClass(/lk/);

  // …y la coordinadora pinta una casilla en el mismo cuadro y espera a que se guarde
  const other = await (await browser.newContext()).newPage();
  await login(other, COORD);
  await other.goto(url);
  await other.getByRole('button', { name: /Mañana/ }).first().click();
  const cellB = other.locator(cell);
  const saved = other.waitForResponse(r => r.url().includes('/cells') && r.request().method() === 'PUT' && r.ok());
  await cellB.click(); await saved;
  await other.context().close();

  // Sin tocar nada, al volver a la pestaña (aquí: evento de foco) se actualiza y avisa quién lo cambió
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('Coordinadora Demo cambió este cuadro y ya se actualizó aquí.')).toBeVisible();
  await expect(cellA).toHaveClass(/lk/); // la casilla que pintó la otra persona ya está aquí
  await expect(page.locator('.banner', { hasText: 'mientras lo editabas' })).toHaveCount(0);
});
