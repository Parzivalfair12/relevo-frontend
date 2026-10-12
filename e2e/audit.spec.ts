import { expect, test } from '@playwright/test';
import { ADMIN, COORD, login, tab } from './helpers';

test.describe.configure({ mode: 'serial' });

test('la coordinadora no ve la pestaña de Auditoría y /audit la devuelve al resumen', async ({ page }) => {
  await login(page, COORD);
  await expect(tab(page, 'Auditoría')).toHaveCount(0);
  await page.goto('/audit');
  await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible();
});

test('el administrador ve el registro, lo filtra y carga más páginas', async ({ page, request }) => {
  // 52 ediciones del propio usuario (mismos datos): llenan más de una página del registro sin ensuciar el resto de los datos
  const token = (await (await request.post('/api/v1/auth/login', { data: { email: ADMIN.email, password: ADMIN.password } })).json()).accessToken as string;
  const headers = { Authorization: `Bearer ${token}` };
  const me = await (await request.get('/api/v1/auth/me', { headers })).json();
  for (let i = 0; i < 52; i++) {
    const r = await request.patch(`/api/v1/users/${me.id}`, { headers, data: { name: me.name, email: me.email, role: 'admin', serviceIds: [] } });
    expect(r.ok()).toBe(true);
  }

  await login(page, ADMIN);
  await tab(page, 'Auditoría').click();
  await expect(page.getByRole('heading', { name: 'Auditoría' })).toBeVisible();
  await expect(page.getByText('Por ahora los registros se conservan sin límite de tiempo.')).toBeVisible();
  const rows = page.locator('table.tbl tbody tr');
  await expect(rows).toHaveCount(50);                                          // una página
  await expect(page.getByText('Mostrando 50 registro(s)')).toBeVisible();
  await expect(rows.first()).toContainText('Editó');
  await expect(rows.first()).toContainText(`Editó el usuario ${ADMIN.email} (admin)`);
  await expect(rows.first()).toContainText('Administrador Demo');
  await page.getByRole('button', { name: 'Cargar más' }).click();
  await expect.poll(async () => rows.count()).toBeGreaterThan(50);              // la siguiente página se suma
  await expect(page.getByRole('button', { name: 'Cargar más' })).toHaveCount(0); // y ya no hay más

  // Filtros: por tipo, por texto y por fechas; «Quitar filtros» los limpia
  await page.getByLabel('Tipo', { exact: true }).selectOption('schedule');
  await expect(page.getByText('No hay registros con estos filtros.')).toBeVisible(); // aún no se tocó ningún cuadro
  await page.getByLabel('Tipo', { exact: true }).selectOption('user');
  await page.getByLabel('Buscar en el detalle').fill('admin@turnos.demo');
  await expect(rows.first()).toContainText('admin@turnos.demo');
  await page.getByLabel('Desde').fill('2099-01-01');
  await expect(page.getByText('No hay registros con estos filtros.')).toBeVisible();
  await page.getByLabel('Hasta').fill('2098-01-01');
  await expect(page.getByText('La fecha «Desde» no puede ser posterior a «Hasta».')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar filtros' }).click();
  await expect(page.getByRole('button', { name: 'Quitar filtros' })).toHaveCount(0);
  await expect(rows).toHaveCount(50);
});
