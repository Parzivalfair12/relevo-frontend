import { statSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { ADMIN, COORD, login, tab } from './helpers';

test.describe.configure({ mode: 'serial' });

test('una coordinadora arma un mes de principio a fin: crea, pinta, publica y lo ve en el resumen', async ({ page }) => {
  await login(page, COORD);
  await tab(page, 'Cuadros').click();
  await page.getByRole('button', { name: '＋ Nuevo cuadro' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo cuadro' });
  await dialog.getByLabel('Servicio').selectOption({ label: 'UCI Neurocrítica' });
  const month = await dialog.getByLabel('Mes').locator('option:checked').innerText(); // el mes actual, sea cual sea
  await dialog.getByRole('button', { name: 'Crear y generar' }).click();

  // Editor: título, borrador y cuadro generado
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`UCI Neurocrítica · ${month}`);
  await expect(page.locator('.st-pill')).toHaveText('Borrador');
  await expect(page.locator('table.g button[data-p]').first()).toBeVisible();

  // Pintar una casilla y esperar a que se guarde
  await page.getByRole('button', { name: /Mañana/ }).first().click();
  const cell = page.locator('table.g button[data-p]').nth(12);
  const saved = page.waitForResponse(r => r.url().includes('/cells') && r.request().method() === 'PUT' && r.ok());
  await cell.click();
  await expect(cell).toHaveClass(/c-M/);
  await expect(cell).toHaveClass(/lk/);
  await saved;
  await page.reload();
  const again = page.locator('table.g button[data-p]').nth(12);
  await expect(again).toHaveClass(/c-M/);
  await expect(again).toHaveClass(/lk/); // sigue fijada

  // Publicar
  await page.getByRole('button', { name: 'Publicar cuadro' }).click();
  await expect(page.locator('.st-pill')).toHaveText('Publicado');
  await expect(page.getByRole('button', { name: 'Volver a borrador' })).toBeVisible();

  // Resumen: el mes nuevo es el período por defecto y trae horas
  await tab(page, 'Resumen').click();
  await expect(page.getByLabel('Período').locator('option').first()).toHaveText(month);
  await expect(page.getByText('1 cuadro(s) en el período')).toBeVisible();
  await expect(page.locator('.kp .stat b').first()).not.toHaveText('0');
});

test('exportar el cuadro descarga un archivo de Excel y uno de ODS con nombre del servicio y mes', async ({ page }) => {
  await login(page, COORD);
  await tab(page, 'Cuadros').click();
  await page.locator('.qc:not(.new)', { hasText: 'Hospitalización' }).first().click();
  for (const [label, ext] of [['Exportar Excel', 'xlsx'], ['Exportar ODS', 'ods']] as const) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: `↓ ${label}` }).click()]);
    expect(dl.suggestedFilename()).toMatch(new RegExp(`^Hospitalización 7° piso - \\w+ \\d{4}\\.${ext}$`));
    expect(statSync((await dl.path())!).size).toBeGreaterThan(3000);
  }
});

test('el servidor protege lo ajeno: una coordinadora no abre un cuadro de otro servicio', async ({ page, browser }) => {
  // El administrador encuentra el enlace de un cuadro de Urgencias…
  const admin = await (await browser.newContext()).newPage();
  await login(admin, ADMIN);
  await tab(admin, 'Cuadros').click();
  await admin.locator('.qc:not(.new)', { hasText: 'Urgencias' }).first().click();
  await expect(admin.locator('table.g')).toBeVisible();
  const url = admin.url();
  await admin.context().close();
  // …y la coordinadora (sin Urgencias) recibe un aviso y vuelve a la lista
  await login(page, COORD);
  await page.goto(url);
  await expect(page.getByText('No tienes permiso sobre los cuadros de este servicio')).toBeVisible();
  await expect(page).toHaveURL(/\/schedules$/);
});
