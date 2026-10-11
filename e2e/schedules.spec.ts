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
  // Paso 1: meta de horas y equipo propuesto (se puede cambiar) · Paso 2: resumen y confirmación
  await expect(dialog.getByRole('group', { name: 'Personas del cuadro' }).getByRole('checkbox').first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Quiero escribirlas yo' }).click();
  await dialog.getByLabel('Horas de cada persona de planta').fill('120');
  await dialog.getByRole('button', { name: 'Siguiente' }).click();
  await expect(dialog.getByText('120 h cada persona de planta')).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirmar y generar' }).click();

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
  await expect(page.locator('.pagehead').getByRole('button', { name: 'Volver a borrador' })).toBeVisible();

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

test('un cuadro publicado no se edita; en borrador se puede eliminar con confirmación', async ({ page }) => {
  await login(page, COORD);
  await tab(page, 'Cuadros').click();
  await page.getByRole('button', { name: '＋ Nuevo cuadro' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo cuadro' });
  await dialog.getByLabel('Servicio').selectOption({ label: 'Hospitalización 7° piso' });
  await expect(dialog.getByRole('group', { name: 'Personas del cuadro' }).getByRole('checkbox').first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Siguiente' }).click();
  await dialog.getByRole('button', { name: 'Confirmar y generar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hospitalización 7° piso'); // ya está en el editor
  await expect(page.locator('.st-pill')).toHaveText('Borrador');
  await expect(page.getByRole('button', { name: 'Generar cuadro' })).toBeEnabled();

  // Publicado: aviso, nada de edición y no se puede eliminar
  await page.getByRole('button', { name: 'Publicar cuadro' }).click();
  await expect(page.locator('.st-pill')).toHaveText('Publicado');
  const banner = page.locator('.banner', { hasText: 'Este cuadro está publicado.' });
  await expect(banner).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generar cuadro' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Eliminar cuadro' })).toHaveCount(0);
  await expect(page.locator('.brush')).toHaveCount(0); // sin pincel
  await page.locator('table.g button[data-p]').nth(3).click();
  await expect(page.locator('.menu')).toHaveCount(0); // y la casilla no abre su menú

  // Vuelve a borrador desde el aviso: se edita de nuevo
  await banner.getByRole('button', { name: 'Volver a borrador' }).click();
  await expect(page.locator('.st-pill')).toHaveText('Borrador');
  await expect(banner).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generar cuadro' })).toBeEnabled();

  // Eliminar: pide confirmación y Cancelar no borra
  await page.getByRole('button', { name: 'Eliminar cuadro' }).click();
  const confirm = page.getByRole('dialog', { name: 'Eliminar este cuadro' });
  await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hospitalización 7° piso');
  await page.getByRole('button', { name: 'Eliminar cuadro' }).click();
  await page.getByRole('dialog', { name: 'Eliminar este cuadro' }).getByRole('button', { name: 'Sí, eliminar cuadro' }).click();
  await expect(page.getByText('Cuadro eliminado')).toBeVisible();
  await expect(page).toHaveURL(/\/schedules$/);
});
