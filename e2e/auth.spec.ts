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

const URG = { email: 'urgencias@turnos.demo', password: 'urg123' };
const NUEVA = 'clave-nueva-e2e-1', RESTABLECIDA = 'clave-restablecida-e2e-2'; // el mínimo ahora es 8: no se puede volver a «urg123»; cada corrida vuelve a cargar los datos de ejemplo

async function changeOwnPassword(page: import('@playwright/test').Page, current: string, next: string) {
  await page.getByRole('button', { name: 'Contraseña', exact: true }).click();
  const d = page.getByRole('dialog', { name: 'Cambiar mi contraseña' });
  await d.getByLabel('Contraseña actual', { exact: true }).fill(current);
  await d.getByLabel('Contraseña nueva', { exact: true }).fill(next);
  await d.getByLabel('Repite la contraseña nueva', { exact: true }).fill(next);
  await d.getByRole('button', { name: 'Cambiar contraseña' }).click();
  return d;
}
async function openUser(page: import('@playwright/test').Page, email: string) {
  await tab(page, 'Administración').click();
  await page.locator('.urow', { hasText: email }).click();
  return page.getByRole('dialog', { name: 'Editar usuario' });
}
async function tryLogin(page: import('@playwright/test').Page, u: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(u.email);
  await page.getByLabel('Contraseña').fill(u.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test('cambiar la propia contraseña: valida, la vieja deja de servir y la nueva entra', async ({ page }) => {
  await login(page, URG);
  const d = await changeOwnPassword(page, 'no-es-esta-123', NUEVA);
  await expect(d.getByText('La contraseña actual no es correcta.')).toBeVisible(); // sigue con la sesión: no la expulsa
  await d.getByLabel('Repite la contraseña nueva', { exact: true }).fill('otra-distinta-9');
  await expect(d.getByText('Las dos contraseñas nuevas no coinciden.').first()).toBeVisible();
  await d.getByLabel('Contraseña actual', { exact: true }).fill(URG.password);
  await d.getByLabel('Repite la contraseña nueva', { exact: true }).fill(NUEVA);
  await d.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page.getByText('Contraseña cambiada')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible(); // la sesión de quien la cambió sigue abierta

  await page.getByRole('button', { name: 'Salir' }).click();
  await tryLogin(page, URG);
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await login(page, { email: URG.email, password: NUEVA });
  await expect(page.getByRole('heading', { name: 'Resumen de turnos' })).toBeVisible();
});

test('el administrador restablece la contraseña de otra persona y esa persona entra con la nueva', async ({ page }) => {
  await login(page, ADMIN);
  const d = await openUser(page, URG.email);
  await d.getByLabel('Contraseña nueva', { exact: true }).fill(RESTABLECIDA);
  await d.getByRole('button', { name: 'Restablecer contraseña' }).click();
  await expect(page.getByText('Contraseña restablecida')).toBeVisible();
  await page.getByRole('button', { name: 'Salir' }).click();
  await tryLogin(page, { email: URG.email, password: NUEVA }); // la anterior ya no sirve
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await login(page, { email: URG.email, password: RESTABLECIDA });
});

test('cinco intentos fallidos bloquean la cuenta y el administrador la desbloquea', async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await tryLogin(page, { email: COORD.email, password: 'incorrecta-123' });
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  }
  await tryLogin(page, COORD); // ni con la contraseña correcta
  await expect(page.getByText('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, ADMIN);
  await tab(page, 'Administración').click();
  await expect(page.locator('.urow', { hasText: COORD.email }).getByText('Bloqueada')).toBeVisible();
  const d = await openUser(page, COORD.email);
  await expect(d.getByText(/Cuenta bloqueada por intentos fallidos hasta las/)).toBeVisible();
  await d.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByText('Cuenta desbloqueada')).toBeVisible();
  await page.getByRole('button', { name: 'Salir' }).click();
  await login(page, COORD); // ya puede entrar
});

test('eliminar a una persona dueña de cuadros pide a quién pasárselos y los conserva', async ({ page }) => {
  await login(page, ADMIN);
  const d = await openUser(page, URG.email);
  await d.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(d.getByText(/Es dueña de 2 cuadro\(s\)/)).toBeVisible(); // no se elimina todavía
  await expect(page.locator('.urow', { hasText: URG.email })).toHaveCount(1);
  await d.getByLabel(/Es dueña de/).selectOption({ label: 'Administrador Demo' });
  await d.getByRole('button', { name: 'Pasar cuadros y eliminar' }).click();
  await expect(page.getByText('Usuario eliminado')).toBeVisible();
  await expect(page.locator('.urow', { hasText: URG.email })).toHaveCount(0);
  await tab(page, 'Cuadros').click();
  await expect(page.locator('.qc', { hasText: 'Urgencias' }).first()).toContainText('Administrador Demo'); // los cuadros siguen y ahora son suyos
});
