import { monthName, lang, t } from '@/i18n';

export interface PeriodOption { value: string; label: string; from: string; to: string }
const ym = (k: number) => `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`; // AAAA-MM con el mes de 01 a 12

/**
 * Períodos del filtro: los tres meses más recientes que tienen cuadros (el más reciente primero) y,
 * si hay más de uno, el rango completo («Julio a septiembre»).
 */
export function periodOptions(cards: { year: number; month: number }[]): PeriodOption[] {
  const keys = [...new Set(cards.map(c => c.year * 12 + c.month))].sort((a, b) => b - a).slice(0, 3);
  const opts = keys.map(k => ({ value: String(k), label: `${monthName(k % 12)} ${Math.floor(k / 12)}`, from: ym(k), to: ym(k) }));
  if (keys.length > 1) {
    const lo = keys[keys.length - 1], hi = keys[0];
    opts.push({ value: 'q', label: rangeLabel(lo, hi), from: ym(lo), to: ym(hi) });
  }
  return opts;
}

/** «Julio a septiembre»; si el rango cruza un año, con los años: «Diciembre 2026 a febrero 2027». */
export function rangeLabel(lo: number, hi: number): string {
  const crosses = Math.floor(lo / 12) !== Math.floor(hi / 12);
  const from = crosses ? `${monthName(lo % 12)} ${Math.floor(lo / 12)}` : monthName(lo % 12);
  const toName = crosses ? `${monthName(hi % 12)} ${Math.floor(hi / 12)}` : monthName(hi % 12);
  return t('dashboard.period.range', { from, to: lang.value === 'es' ? toName.charAt(0).toLowerCase() + toName.slice(1) : toName });
}

/** Todos los meses entre el primero y el último que tienen cuadros (también los vacíos del medio), del más viejo al más nuevo. */
export function monthKeys(cards: { year: number; month: number }[]): number[] {
  if (!cards.length) return [];
  const all = cards.map(c => c.year * 12 + c.month), lo = Math.min(...all), hi = Math.max(...all);
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}
export const monthLabel = (k: number) => `${monthName(k % 12)} ${Math.floor(k / 12)}`;

/** Rango elegido a mano: acepta los extremos en cualquier orden y devuelve el período en el formato de la API. */
export function customPeriod(a: number, b: number): { from: string; to: string } {
  return { from: ym(Math.min(a, b)), to: ym(Math.max(a, b)) };
}
