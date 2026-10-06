import type { ImportTableDTO } from '@/shared';

/** Quién del directorio corresponde a cada persona del archivo (por fila del archivo); '' = no importar. */
export type Mapping = Record<number, string>;

/** Tabla que se propone al abrir: la del mes más reciente y, si empatan, la que tiene más personas. */
export const bestTable = (tables: ImportTableDTO[]): ImportTableDTO =>
  tables.reduce((best, t) => {
    const k = (x: ImportTableDTO) => (x.year !== null && x.month !== null ? x.year * 12 + x.month : -1);
    return k(t) > k(best) || (k(t) === k(best) && t.people.length > best.people.length) ? t : best;
  });

/** Punto de partida del mapeo: lo que el servidor reconoció. */
export const initialMapping = (t: ImportTableDTO): Mapping => Object.fromEntries(t.people.map(p => [p.row, p.matchId ?? '']));

/** Cuántas personas se importan, cuántas casillas no se entendieron (de ellas) y si alguien del directorio se eligió dos veces. */
export function summarize(t: ImportTableDTO, m: Mapping) {
  const chosen = t.people.filter(p => m[p.row]);
  const ids = chosen.map(p => m[p.row]);
  return {
    selected: chosen.length, total: t.people.length,
    warnings: chosen.reduce((a, p) => a + p.warnings.length, 0),
    duplicated: new Set(ids).size !== ids.length
  };
}

/** Lo que se envía al crear el cuadro: solo las personas elegidas, con el texto de sus casillas tal como vino. */
export const membersOf = (t: ImportTableDTO, m: Mapping) => t.people.filter(p => m[p.row]).map(p => ({ therapistId: m[p.row], cells: p.cells }));
