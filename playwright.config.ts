import { defineConfig } from '@playwright/test';

/**
 * Pruebas de extremo a extremo: levantan su propia API (puerto 4100) y su propia web (5183) contra una base aparte
 * (`turnos_e2e` en el MongoDB de Docker, puerto 27018). No tocan los datos de desarrollo ni los servidores que ya tengas corriendo.
 * Requisitos: el backend en ../backend con `npm install` hecho y MongoDB arriba (`npm run db:up` allí).
 * Localmente con Edge:  PW_CHANNEL=msedge npm run e2e      En CI (Chromium):  npm run e2e
 */
const API_PORT = 4100, WEB_PORT = 5183;
const MONGO_URI = process.env.E2E_MONGO_URI ?? 'mongodb://127.0.0.1:27018/turnos_e2e?replicaSet=rs0&directConnection=true';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false, workers: 1, // comparten una base de datos
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  use: { baseURL: `http://localhost:${WEB_PORT}`, channel: process.env.PW_CHANNEL || undefined, viewport: { width: 1440, height: 900 }, locale: 'es-CO', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm run dev', cwd: '../backend', url: `http://localhost:${API_PORT}/api/v1/health/ready`, reuseExistingServer: false, timeout: 60_000,
      env: { PORT: String(API_PORT), MONGO_URI, NODE_ENV: 'development', CORS_ORIGIN: `http://localhost:${WEB_PORT}`, LOG_LEVEL: 'warn' }
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`, url: `http://localhost:${WEB_PORT}`, reuseExistingServer: false, timeout: 60_000,
      env: { API_URL: `http://localhost:${API_PORT}`, VITE_DEMO_USERS: 'true' }
    }
  ]
});
