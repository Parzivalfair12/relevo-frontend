import { MESES } from '@/shared';

export interface PeriodOption { value: string; label: string; from: string; to: string }
const ym = (k: number) => `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`; // AAAA-MM con el mes de 01 a 12

/**
 * Períodos del filtro: los tres meses más recientes que tienen cuadros (el más reciente primero) y,
 * si hay más de uno, el rango completo («Julio a septiembre»).
 */
export function periodOptions(cards: { year: number; month: number }[]): PeriodOption[] {
  const keys = [...new Set(cards.map(c => c.year * 12 + c.month))].sort((a, b) => b - a).slice(0, 3);
  const opts = keys.map(k => ({ value: String(k), label: `${MESES[k % 12]} ${Math.floor(k / 12)}`, from: ym(k), to: ym(k) }));
  if (keys.length > 1) {
    const lo = keys[keys.length - 1], hi = keys[0];
    opts.push({ value: 'q', label: `${MESES[lo % 12]} a ${MESES[hi % 12].toLowerCase()}`, from: ym(lo), to: ym(hi) });
  }
  return opts;
}
