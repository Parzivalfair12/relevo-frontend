import { ref } from 'vue';

/** Tema de la web: «auto» sigue al sistema; claro y oscuro se eligen a mano y se recuerdan en este navegador. */
export type ThemeMode = 'auto' | 'light' | 'dark';
const KEY = 'relevo.theme';

const read = (): ThemeMode => {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'auto'; } catch { return 'auto'; }
};
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

export const themeMode = ref<ThemeMode>(read());
export const resolvedTheme = (mode: ThemeMode = themeMode.value): 'light' | 'dark' => (mode === 'auto' ? (media?.matches ? 'dark' : 'light') : mode);

export function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0A131B' : '#0A8791');
}
export function setThemeMode(mode: ThemeMode) {
  themeMode.value = mode;
  try { localStorage.setItem(KEY, mode); } catch { /* sin almacenamiento: vale para esta visita */ }
  applyTheme();
}
/** auto → claro → oscuro → auto */
export const cycleTheme = () => setThemeMode(themeMode.value === 'auto' ? 'light' : themeMode.value === 'light' ? 'dark' : 'auto');

media?.addEventListener?.('change', () => { if (themeMode.value === 'auto') applyTheme(); });
