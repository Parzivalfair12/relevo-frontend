import { expect, type Page } from '@playwright/test';

export const ADMIN = { email: 'admin@turnos.demo', password: 'admin123' };
export const COORD = { email: 'coordinadora@turnos.demo', password: 'coord123' };

export async function login(page: Page, u: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(u.email);
  await page.getByLabel('Contraseña').fill(u.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
}
export const tab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name });
