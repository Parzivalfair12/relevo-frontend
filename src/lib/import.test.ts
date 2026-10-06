import { describe, expect, it } from 'vitest';
import type { ImportTableDTO } from '@/shared';
import { bestTable, initialMapping, membersOf, summarize } from './import';

const person = (row: number, name: string, matchId: string | null, warnings: string[] = []) => ({ name, row, cells: ['M', ''], codes: ['M', 'L'] as never, warnings, matchId, suggestions: [] });
const table: ImportTableDTO = {
  id: '0', sheet: 'SERV-PISO', headerRow: 6, title: 't', year: 2026, month: 8, days: 30,
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
  it('envía solo las elegidas, con el texto original de sus casillas', () => {
    expect(membersOf(table, { 8: 'a', 10: '', 12: 'z' })).toEqual([{ therapistId: 'a', cells: ['M', ''] }, { therapistId: 'z', cells: ['M', ''] }]);
  });
  it('propone la tabla del mes más reciente y, a igual mes, la de más personas', () => {
    const t = (id: string, year: number | null, month: number | null, n: number): ImportTableDTO => ({ ...table, id, year, month, people: table.people.slice(0, 1).concat(Array.from({ length: n - 1 }, (_, i) => person(100 + i, 'X' + i, null))) });
    expect(bestTable([t('a', 2025, 4, 6), t('b', 2026, 8, 2), t('c', 2026, 8, 5), t('d', null, null, 9)]).id).toBe('c');
    expect(bestTable([t('a', null, null, 3), t('b', null, null, 7)]).id).toBe('b'); // sin mes detectado, la de más personas
  });
});
