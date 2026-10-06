import { describe, expect, it } from 'vitest';
import type { ScheduleDTO } from '@/shared';
import { absDays, absRanges, conflictIssues, issuesOf, monthOptions, toTsv } from './schedule';

const days = (n: number, over: Record<number, string> = {}) => Array.from({ length: n }, (_, i) => over[i] ?? 'L');
function schedule(over: Partial<ScheduleDTO> = {}): ScheduleDTO {
  return {
    id: 's1', serviceId: 'sv', year: 2026, month: 8, status: 'bor', ownerId: 'u', ownerName: 'Admin', version: 0, seed: 3,
    coverage: { M: 1, T: 1, N: 1 }, rules: { seq: true, restAfterN: true, weekends: true, balance: true, maxConsec: 5, support: 'need' },
    prev: {}, busy: {},
    members: [
      { therapistId: 'a', name: 'Ana Pérez', kind: 'fija', targetHours: null, days: days(30, { 0: 'M', 1: 'N', 2: 'M' }) as never, locked: {} },
      { therapistId: 'b', name: 'Bea Díaz', kind: 'apoyo', targetHours: null, days: days(30) as never, locked: {} }
    ],
    ...over
  };
}

describe('rangos de ausencia', () => {
  it('une días seguidos del mismo tipo y separa tipos distintos (días 1 a n)', () => {
    const m = schedule().members[0];
    m.locked = { 4: 'V', 5: 'V', 6: 'V', 7: 'I', 12: 'P', 20: 'M' }; // el M fijado no es ausencia
    expect(absRanges(m, 30)).toEqual([{ code: 'V', from: 5, to: 7 }, { code: 'I', from: 8, to: 8 }, { code: 'P', from: 13, to: 13 }]);
    expect(absDays(m, 30)).toBe(5);
  });
});

describe('alertas en vivo', () => {
  it('usa el motor: trabajar tras una noche es crítico', () => {
    const msgs = issuesOf(schedule()).filter(i => i.id === 'a').map(i => i.msg);
    expect(msgs).toContain('Ana Pérez: trabaja el 3 después de noche (falta descanso)');
  });
  it('cruces con otro cuadro: solo cuando las dos casillas son de trabajo', () => {
    const s = schedule({ busy: { a: { 0: 'Urgencias', 5: 'Urgencias' } } });
    expect(conflictIssues(s).map(i => i.msg)).toEqual(['Ana Pérez: el día 1 también trabaja en Urgencias']); // el día 6 es libre aquí
  });
});

describe('mes para el cuadro nuevo', () => {
  it('ofrece nueve meses: tres atrás, el actual (por defecto) y cinco adelante', () => {
    const o = monthOptions(new Date(2026, 9, 4)); // 4 de octubre de 2026
    expect(o).toHaveLength(9);
    expect(o[0]).toMatchObject({ year: 2026, month: 6 });
    expect(o[8]).toMatchObject({ year: 2027, month: 2 });
    expect(o.filter(x => x.current)).toEqual([{ year: 2026, month: 9, current: true }]);
  });
  it('cruza el cambio de año', () => {
    const o = monthOptions(new Date(2026, 0, 15));
    expect(o[0]).toMatchObject({ year: 2025, month: 9 }); // octubre de 2025
  });
});

describe('copiar para Excel', () => {
  it('planta primero, un código por día, libres vacíos y horas al final', () => {
    const s = schedule();
    s.members.reverse(); // el apoyo viene primero en los datos: la planta debe salir arriba
    const rows = toTsv(s).trimEnd().split('\n');
    expect(rows[0]).toBe(['Terapeuta', ...Array.from({ length: 30 }, (_, i) => i + 1), 'Horas'].join('\t'));
    expect(rows[1].split('\t').slice(0, 5)).toEqual(['Ana Pérez', 'M', 'N', 'M', '']);
    expect(rows[1].endsWith('\t24')).toBe(true); // 6 + 12 + 6
    expect(rows[2].split('\t')[0]).toBe('Bea Díaz');
  });
});
