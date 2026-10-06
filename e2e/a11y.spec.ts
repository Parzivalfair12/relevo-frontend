import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ADMIN, login, tab } from './helpers';

/**
 * Accesibilidad con axe (WCAG 2.0/2.1, niveles A y AA). Falla ante cualquier problema de impacto serio o crítico
 * (etiquetas, nombres, ARIA, foco, estructura…), salvo el CONTRASTE DE COLOR: ese sale de la paleta aprobada del mockup
 * (tokens.css, que no se cambia sin aprobación). Se lista en la salida para decidirlo con datos.
 */
const NL = '\n';
const contrast = new Map<string, number>();
async function audit(page: Page, name: string) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  for (const n of r.violations.find(v => v.id === 'color-contrast')?.nodes ?? []) {
    const d = n.any[0]?.data as { fgColor: string; bgColor: string; contrastRatio: number; expectedContrastRatio: string };
    const k = `${d.fgColor} sobre ${d.bgColor}: ${d.contrastRatio} (mínimo ${d.expectedContrastRatio})`;
    contrast.set(k, (contrast.get(k) ?? 0) + 1);
  }
  const bad = r.violations.filter(v => (v.impact === 'serious' || v.impact === 'critical') && v.id !== 'color-contrast');
  const resumen = bad.map(v => `${v.id} (${v.impact}): ${v.help} · ${v.nodes.length} elemento(s) · ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
  expect(resumen, `${name}${NL}${resumen.join(NL)}`).toEqual([]);
}
test.afterAll(() => {
  if (!contrast.size) return;
  const rows = [...contrast].sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${n} elemento(s)  ${k}`);
  console.log(`${NL}Contraste por debajo de WCAG AA (pendiente de decisión de diseño, ${contrast.size} combinaciones):${NL}${rows.join(NL)}`);
});

test.describe('accesibilidad (axe)', () => {
  test.describe.configure({ timeout: 180_000 }); // axe sobre la grilla completa tarda; cada prueba hace varias auditorías
  test('inicio de sesión y crear cuenta', async ({ page }) => {
    await page.goto('/login');
    await audit(page, 'login');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await audit(page, 'crear cuenta');
  });

  test('pantallas con sesión de administrador', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible();
    await expect(page.locator('table.tbl tbody tr').first()).toBeVisible();
    await audit(page, 'resumen');
    await page.locator('table.tbl tbody tr').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'resumen · detalle de persona');
    await page.keyboard.press('Escape');
    await tab(page, 'Cuadros').click();
    await expect(page.locator('.qc').first()).toBeVisible();
    await audit(page, 'cuadros');
    await page.getByRole('button', { name: '↑ Importar cuadro' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'importar cuadro');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '＋ Nuevo cuadro' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'nuevo cuadro');
    await page.keyboard.press('Escape');
    await tab(page, 'Equipo').click();
    await expect(page.locator('table.tbl tbody tr').first()).toBeVisible();
    await audit(page, 'equipo');
    await page.locator('table.tbl tbody tr').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'equipo · terapeuta');
    await page.keyboard.press('Escape');
    await tab(page, 'Administración').click();
    await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible();
    await audit(page, 'administración');
    await page.getByRole('button', { name: '＋ Crear usuario' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'administración · crear usuario');
    await page.keyboard.press('Escape');
    await page.locator('.urow').first().click(); // un servicio
    await expect(page.getByRole('dialog', { name: 'Editar servicio' })).toBeVisible();
    await audit(page, 'administración · editar servicio');
    await page.keyboard.press('Escape');
  });

  test('editor de cuadro: grilla, menús y diálogos', async ({ page }) => {
    await login(page, ADMIN);
    await tab(page, 'Cuadros').click();
    await page.locator('.qc:not(.new)', { hasText: 'UCI Neurocrítica' }).first().click();
    await expect(page.locator('table.g button[data-p]').first()).toBeVisible();
    await audit(page, 'editor');
    await page.locator('table.g button[data-p]').nth(5).click();
    await expect(page.locator('.menu')).toBeVisible();
    await audit(page, 'editor · menú de casilla');
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    await page.getByText('Reglas', { exact: true }).click(); // panel desplegable: sus interruptores también se revisan
    await expect(page.getByRole('checkbox', { name: 'Igualar horas' })).toBeVisible();
    await audit(page, 'editor · reglas');
    await page.getByRole('button', { name: '＋ Registrar ausencia' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'editor · ausencia');
    await page.keyboard.press('Escape');
    await page.locator('td.nm.cl').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'editor · detalle de persona');
  });

  test('en pantalla de celular (400 px)', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 860 });
    await login(page, ADMIN);
    await expect(page.locator('table.tbl tbody tr').first()).toBeVisible();
    await audit(page, 'resumen 400');
    await tab(page, 'Cuadros').click();
    await page.locator('.qc:not(.new)', { hasText: 'UCI Neurocrítica' }).first().click();
    await expect(page.locator('table.g button[data-p]').first()).toBeVisible();
    await audit(page, 'editor 400');
  });
});
