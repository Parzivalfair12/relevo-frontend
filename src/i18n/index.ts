import { computed } from 'vue';
import { createI18n } from 'vue-i18n';
import { translateServerMessage } from './serverMessages';

/**
 * Idiomas de Relevo. El español es el idioma base y el de respaldo: si falta una frase en inglés se ve en español.
 * Los textos viven en src/i18n/locales/<idioma>/<espacio>.ts (un archivo por zona de la interfaz) y se juntan aquí solos.
 * Para añadir un texto: crea la clave en el archivo de es y en el de en con el mismo nombre (una prueba vigila que coincidan).
 */
export type Lang = 'es' | 'en';
export const LANGS: { code: Lang; label: string }[] = [{ code: 'es', label: 'Español' }, { code: 'en', label: 'English' }];
const KEY = 'relevo.lang';

const files = import.meta.glob('./locales/*/*.ts', { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>;
const messages: Record<Lang, Record<string, unknown>> = { es: {}, en: {} };
for (const [path, content] of Object.entries(files)) {
  const m = /\.\/locales\/(es|en)\/(.+)\.ts$/.exec(path);
  if (m) messages[m[1] as Lang][m[2]] = content;
}

/** Siempre arranca en español salvo que la usuaria haya elegido otro idioma en este navegador. */
function initial(): Lang {
  try { const v = localStorage.getItem(KEY); return v === 'en' ? 'en' : 'es'; } catch { return 'es'; }
}

export const i18n = createI18n({ legacy: false, locale: initial(), fallbackLocale: 'es', messages: messages as never, missingWarn: false, fallbackWarn: false });
/** Se tipa a mano lo que se usa: los tipos genéricos de vue-i18n son tan profundos que TypeScript se rinde. */
type TFn = (key: string, arg?: Record<string, unknown> | unknown[] | number) => string;
interface Global { t: TFn; locale: { value: string }; getLocaleMessage(l: string): unknown }
const g = (i18n as unknown as { global: Global }).global;

/** Traducir fuera de un componente (stores, lib). Dentro de un componente: `const { t } = useI18n()`. */
export const t = g.t;
export const lang = computed<Lang>(() => g.locale.value as Lang);
export const bcp47 = () => (lang.value === 'es' ? 'es-CO' : 'en-US');

export function setLang(l: Lang) {
  g.locale.value = l;
  document.documentElement.setAttribute('lang', l);
  try { localStorage.setItem(KEY, l); } catch { /* vale para esta visita */ }
}
if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', lang.value);

/* ---- Ayudas de formato que dependen del idioma ---- */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Nombre del mes (índice 0 a 11): «Septiembre» / «September». */
export const monthName = (i: number) => cap(new Intl.DateTimeFormat(bcp47(), { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, i, 15))));
/** Letra del día de la semana (0 = domingo) para el encabezado del cuadro. En español el miércoles lleva «M», como en los cuadros del hospital. */
export const dayLetter = (dow: number) => (lang.value === 'es' ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'])[dow];
export const formatNumber = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(bcp47(), opts);
export const shiftName = (code: string) => t(`common.shiftName.${code}`);
export const shiftDesc = (code: string) => t(`common.shiftDesc.${code}`);
/** El cargo se guarda en español en la base; aquí se muestra en el idioma activo. */
export const positionLabel = (p: string) => {
  const map = g.getLocaleMessage(lang.value) as { common?: { positions?: Record<string, string> } };
  return map.common?.positions?.[p] ?? p;
};

/**
 * Los mensajes del servidor y de los esquemas compartidos llegan en español. En inglés se traducen con la tabla de
 * src/i18n/serverMessages.ts; lo que no esté en la tabla se muestra tal cual.
 */
export const tm = (msg: string) => (lang.value === 'es' ? msg : translateServerMessage(msg));
