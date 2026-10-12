import { expect, test } from '@playwright/test';
import { ADMIN, login, tab } from './helpers';

test('el directorio se pagina de 25 en 25, y los filtros vuelven a la primera página', async ({ page, request }) => {
  // El directorio de ejemplo trae 18; se suman 12 para pasar de 25 (llegan al final de la lista: sus nombres empiezan con «Zz»)
  const token = (await (await request.post('/api/v1/auth/login', { data: { email: ADMIN.email, password: ADMIN.password } })).json()).accessToken as string;
  const headers = { Authorization: `Bearer ${token}` };
  const services = await (await request.get('/api/v1/services', { headers })).json();
  const before = (await (await request.get('/api/v1/therapists', { headers })).json()).length as number;
  for (let i = 1; i <= 12; i++) {
    const r = await request.post('/api/v1/therapists', { headers, data: { name: `Zz Paginación ${String(i).padStart(2, '0')}`, position: 'Terapeuta respiratoria', defaultKind: 'fija', serviceIds: [services[0].id] } });
    expect(r.ok()).toBe(true);
  }
  const total = before + 12, rows = page.locator('table.tbl tbody tr');

  await login(page, ADMIN);
  await tab(page, 'Equipo').click();
  await expect(rows).toHaveCount(25);
  const pager = page.getByRole('navigation', { name: 'Páginas del directorio' });
  await expect(pager.getByText(`Mostrando 1–25 de ${total}`)).toBeVisible();
  await expect(pager.getByText('Página 1 de 2')).toBeVisible();
  await expect(pager.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  await expect(rows.first()).not.toContainText('Zz Paginación'); // el orden es alfabético

  await pager.getByRole('button', { name: 'Siguiente' }).click();
  await expect(rows).toHaveCount(total - 25);
  await expect(pager.getByText(`Mostrando 26–${total} de ${total}`)).toBeVisible();
  await expect(pager.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await expect(rows.last()).toContainText('Zz Paginación 12');

  // Un filtro con pocos resultados vuelve a la página 1 y esconde los controles
  await page.getByPlaceholder('Buscar por nombre o documento').fill('Zz Paginación');
  await expect(rows).toHaveCount(12);
  await expect(page.getByRole('navigation', { name: 'Páginas del directorio' })).toHaveCount(0);
  await page.getByPlaceholder('Buscar por nombre o documento').fill('');
  await expect(rows).toHaveCount(25); // sin filtro, otra vez desde la primera página
  await expect(page.getByRole('navigation', { name: 'Páginas del directorio' }).getByText('Página 1 de 2')).toBeVisible();
});
