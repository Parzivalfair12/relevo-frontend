import { expect, test } from '@playwright/test';
import { ADMIN, COORD, login, tab } from './helpers';

test.describe.configure({ mode: 'serial' });

test('credenciales incorrectas muestran el mensaje y no entran', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(ADMIN.email);
  await page.getByLabel('Contraseña').fill('incorrecta-123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('el administrador entra, recarga sin perder la sesión y sale', async ({ page }) => {
  await login(page, ADMIN);
  await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible();
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/team');
  await expect(page).toHaveURL(/\/login$/); // tras salir, las rutas piden sesión
});

test('una cuenta nueva queda pendiente, el administrador la aprueba y entonces puede entrar', async ({ page, browser }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre completo').fill('Persona Nueva E2E');
  await page.getByLabel('Correo').fill('nueva.e2e@turnos.demo');
  await page.getByLabel('Contraseña').fill('clave-e2e-segura');
  await page.getByRole('button', { name: 'Solicitar acceso' }).click();
  await expect(page.getByText('Solicitud enviada.')).toBeVisible();
  // todavía no puede entrar
  await page.getByLabel('Correo').fill('nueva.e2e@turnos.demo');
  await page.getByLabel('Contraseña').fill('clave-e2e-segura');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('pendiente de aprobación')).toBeVisible();

  // el administrador la aprueba y le asigna un servicio
  const admin = await (await browser.newContext()).newPage();
  await login(admin, ADMIN);
  await tab(admin, 'Administración').click();
  await expect(admin.getByText('1 solicitud(es) de acceso pendientes.')).toBeVisible();
  await admin.getByRole('button', { name: 'Revisar y aprobar' }).click();
  await admin.getByRole('button', { name: /UCI Neurocrítica/ }).click();
  await admin.getByRole('button', { name: 'Aprobar y guardar' }).click();
  await expect(admin.getByText('Acceso aprobado')).toBeVisible();
  await admin.context().close();

  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
  await expect(tab(page, 'Administración')).toHaveCount(0); // es coordinadora
});

test('la coordinadora no ve Administración y /admin la devuelve al resumen', async ({ page }) => {
  await login(page, COORD);
  await expect(tab(page, 'Administración')).toHaveCount(0);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible();
});
