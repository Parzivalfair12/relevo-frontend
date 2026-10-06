import { describe, expect, it } from 'vitest';
import type { ImportTableDTO } from '@/shared';
import { bestTable, initialMapping, initialSetups, membersOf, problemOf, summarize, type TableSetup } from './import';

const person = (row: number, name: string, matchId: string | null, warnings: string[] = []) => ({ name, row, cells: ['M', ''], codes: ['M', 'L'] as never, warnings, hours: null as number | null, matchId, suggestions: [] });
const table: ImportTableDTO = {
  id: '0', sheet: 'SERV-PISO', headerRow: 6, title: 't', year: 2026, month: 8, days: 30, serviceId: 's1',
  people: [person(8, 'ANA', 'a'), person(10, 'BEA', 'b', ['Día 1: «MN» no se reconoce; quedó libre.']), person(12, 'CIRA', null)]
};

describe('importar: mapeo de personas', () => {
  it('parte de lo que el servidor reconoció; quien no coincide queda sin importar', () => {
    expect(initialMapping(table)).toEqual({ 8: 'a', 10: 'b', 12: '' });
  });
  it('cuenta personas elegidas y casillas sin entender solo de las elegidas', () => {
    expect(summarize(table, { 8: 'a', 10: 'b', 12: '' })).toEqual({ selected: 2, total: 3, warnings: 1, duplicated: false });
    expect(summarize(table, { 8: 'a', 10: '', 12: '' })).toMatchObject({ selected: 1, warnings: 0 });
  });
  it('detecta cuando la misma persona del directorio se eligió dos veces', () => {
    expect(summarize(table, { 8: 'a', 10: 'a', 12: '' }).duplicated).toBe(true);
  });
  it('envía solo las elegidas, con el texto original, el tipo y la meta de horas', () => {
    expect(membersOf(table, { mapping: { 8: 'a', 10: '', 12: 'z' }, kinds: { 8: 'apoyo', 12: 'fija' }, hours: { 8: 96, 12: null } }))
      .toEqual([{ therapistId: 'a', cells: ['M', ''], kind: 'apoyo', targetHours: 96 }, { therapistId: 'z', cells: ['M', ''], kind: 'fija' }]);
  });
  it('propone la tabla del mes más reciente y, a igual mes, la de más personas', () => {
    const t = (id: string, year: number | null, month: number | null, n: number): ImportTableDTO => ({ ...table, id, year, month, people: table.people.slice(0, 1).concat(Array.from({ length: n - 1 }, (_, i) => person(100 + i, 'X' + i, null))) });
    expect(bestTable([t('a', 2025, 4, 6), t('b', 2026, 8, 2), t('c', 2026, 8, 5), t('d', null, null, 9)]).id).toBe('c');
    expect(bestTable([t('a', null, null, 3), t('b', null, null, 7)]).id).toBe('b'); // sin mes detectado, la de más personas
  });
});

describe('importar: varias tablas a la vez', () => {
  const t = (id: string, year: number | null, month: number | null, serviceId: string | null, matched: number): ImportTableDTO => ({
    ...table, id, year, month, serviceId, people: Array.from({ length: 4 }, (_, i) => ({ ...person(10 + i, 'P' + i, i < matched ? 'd' + i : null), hours: i === 0 ? 162 : null }))
  });
  const kindOf = (id: string) => (id === 'd1' ? 'apoyo' as const : 'fija' as const);

  it('marca solo las tablas del mes más reciente con servicio reconocido y 2 o más personas', () => {
    const s = initialSetups([t('a', 2025, 4, 's1', 4), t('b', 2026, 8, 's1', 3), t('c', 2026, 8, null, 4), t('d', 2026, 8, 's2', 1), t('e', null, null, 's1', 4)], kindOf, 'sx');
    expect(Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.include]))).toEqual({ a: false, b: true, c: false, d: false, e: false });
  });
  it('parte del tipo del directorio y de las horas del archivo; sin horas, meta automática', () => {
    const s = initialSetups([t('b', 2026, 8, 's1', 3)], kindOf, 'sx').b;
    expect(s).toMatchObject({ serviceId: 's1', year: 2026, month: 8 });
    expect(s.kinds).toEqual({ 10: 'fija', 11: 'apoyo', 12: 'fija', 13: 'fija' });
    expect(s.hours).toEqual({ 10: 162, 11: null, 12: null, 13: null });
  });
  it('sin servicio reconocido usa el de respaldo', () => {
    expect(initialSetups([t('c', 2026, 8, null, 4)], kindOf, 'sx').c.serviceId).toBe('sx');
  });

  const base = (over: Partial<TableSetup> = {}): TableSetup => ({ include: true, serviceId: 's1', year: 2026, month: 8, mapping: { 8: 'a', 10: 'b', 12: '' }, kinds: {}, hours: {}, ...over });
  it('explica qué impide importar una tabla', () => {
    expect(problemOf(table, base(), false, new Set())).toBeNull();
    expect(problemOf(table, base({ serviceId: '' }), false, new Set())).toMatch(/servicio/);
    expect(problemOf(table, base({ mapping: { 8: 'a', 10: 'a', 12: '' } }), false, new Set())).toMatch(/solo puede elegirse una vez/);
    expect(problemOf(table, base({ mapping: { 8: 'a', 10: '', 12: '' } }), false, new Set())).toMatch(/al menos 2/);
    expect(problemOf(table, base(), true, new Set())).toMatch(/Ya existe/);
    expect(problemOf(table, base(), false, new Set(['s1|2026|8']))).toMatch(/mismo servicio y mes/);
    expect(problemOf(table, base({ hours: { 8: 9999 } }), false, new Set())).toMatch(/meta de horas/);
  });
});
