import { expect, test } from '@playwright/test';
import { ADMIN, COORD, login, tab } from './helpers';

test.describe.configure({ mode: 'serial' });

const FILE = 'e2e/fixtures/importar-uci.xlsx'; // hoja «UCI» (el servicio no está en el título), dos personas del directorio y una nueva

async function readFile(page: import('@playwright/test').Page) {
  await tab(page, 'Cuadros').click();
  await page.getByRole('button', { name: '↑ Importar cuadro' }).click();
  const dialog = page.getByRole('dialog', { name: 'Importar cuadros' });
  await dialog.getByLabel('Archivo').setInputFiles(FILE);
  await dialog.getByRole('button', { name: 'Leer archivo' }).click();
  await expect(dialog.getByText('UCI', { exact: true }).first()).toBeVisible();
  return dialog;
}

test('el servicio sale de la abreviatura de la hoja y una coordinadora no puede registrar a quien falta', async ({ page }) => {
  await login(page, COORD);
  const dialog = await readFile(page);
  await expect(dialog.getByLabel('Servicio').locator('option:checked')).toHaveText('UCI Neurocrítica'); // hoja «UCI» → UCI Neurocrítica
  await expect(dialog.getByLabel('LUCIA NUEVA PRUEBA', { exact: true })).toHaveValue('');
  await expect(dialog.getByText('No está en el directorio. Pídele a un administrador que la registre en Equipo.')).toBeVisible();
  await expect(dialog.getByRole('option', { name: /Registrar «Lucia Nueva Prueba»/ })).toHaveCount(0);
});

test('un administrador registra a la persona nueva al importar y queda en el cuadro y en el directorio', async ({ page }) => {
  await login(page, ADMIN);
  const dialog = await readFile(page);
  await dialog.getByLabel('LUCIA NUEVA PRUEBA', { exact: true }).selectOption({ label: '＋ Registrar «Lucia Nueva Prueba» como terapeuta nueva' });
  await expect(dialog.getByText('Se registrarán 1 terapeuta(s) nueva(s) en el directorio al importar.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Importar 1 cuadro' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('UCI Neurocrítica · Enero 2026');
  await expect(page.locator('#teamPanel')).toContainText('Lucia Nueva Prueba');
  await tab(page, 'Equipo').click();
  await page.getByPlaceholder('Buscar por nombre o documento').fill('Lucia Nueva');
  await expect(page.locator('table.tbl tbody tr')).toHaveCount(1);
  await expect(page.locator('table.tbl tbody tr')).toContainText('Lucia Nueva Prueba');
});
