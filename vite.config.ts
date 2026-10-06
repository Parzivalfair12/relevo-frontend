import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // En desarrollo la web habla con la API por este proxy (mismo origen, sin CORS): /api → backend en :4000
  server: { port: 5173, proxy: { '/api': process.env.API_URL ?? 'http://localhost:4000' } },
  // Las pruebas de extremo a extremo (e2e/) las corre Playwright, no Vitest
  test: { environment: 'jsdom', exclude: ['e2e/**', 'node_modules/**', 'dist/**'] }
});
