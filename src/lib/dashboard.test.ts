import { describe, expect, it } from 'vitest';
import { periodOptions } from './dashboard';

const m = (year: number, month: number) => ({ year, month });

describe('períodos del resumen', () => {
  it('tres meses más recientes (el último primero) y el rango completo', () => {
    const o = periodOptions([m(2026, 6), m(2026, 6), m(2026, 7), m(2026, 8), m(2026, 3)]); // mes 3 queda fuera: solo los 3 últimos
    expect(o.map(x => x.label)).toEqual(['Septiembre 2026', 'Agosto 2026', 'Julio 2026', 'Julio a septiembre']);
    expect(o[0]).toMatchObject({ from: '2026-09', to: '2026-09' }); // el mes va de 01 a 12 en la URL
    expect(o[3]).toMatchObject({ value: 'q', from: '2026-07', to: '2026-09' });
  });
  it('con un solo mes no hay rango; sin cuadros no hay períodos', () => {
    expect(periodOptions([m(2026, 9)]).map(x => x.label)).toEqual(['Octubre 2026']);
    expect(periodOptions([])).toEqual([]);
  });
  it('cruza el cambio de año', () => {
    const o = periodOptions([m(2026, 11), m(2027, 0), m(2027, 1)]);
    expect(o.map(x => x.label)).toEqual(['Febrero 2027', 'Enero 2027', 'Diciembre 2026', 'Diciembre a febrero']);
    expect(o[3]).toMatchObject({ from: '2026-12', to: '2027-02' });
  });
});
