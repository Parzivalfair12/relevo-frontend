import type { ImportTableDTO, Kind } from '@/shared';

/** Quién del directorio corresponde a cada persona del archivo (por fila del archivo); '' = no importar. */
export type Mapping = Record<number, string>;

/**
 * Lo que la usuaria decide para cada tabla del archivo antes de importar.
 * `kinds` es planta o apoyo en ESTE cuadro; `hours` es la meta mensual de cada persona (null = automática).
 */
export interface TableSetup {
  include: boolean; serviceId: string; year: number; month: number;
  mapping: Mapping; kinds: Record<number, Kind>; hours: Record<number, number | null>
}

const periodOf = (x: ImportTableDTO) => (x.year !== null && x.month !== null ? x.year * 12 + x.month : -1);

/** Tabla que se propone al abrir: la del mes más reciente y, si empatan, la que tiene más personas. */
export const bestTable = (tables: ImportTableDTO[]): ImportTableDTO =>
  tables.reduce((best, t) => (periodOf(t) > periodOf(best) || (periodOf(t) === periodOf(best) && t.people.length > best.people.length) ? t : best));

/** Punto de partida del mapeo: lo que el servidor reconoció. */
export const initialMapping = (t: ImportTableDTO): Mapping => Object.fromEntries(t.people.map(p => [p.row, p.matchId ?? '']));

/**
 * Punto de partida de cada tabla. Se marcan para importar las del mes más reciente del archivo que tengan servicio
 * reconocido y al menos 2 personas reconocidas; las demás (meses viejos, plantillas) quedan sin marcar.
 * `kindOf` da el tipo del directorio (planta o apoyo) de una terapeuta.
 */
export function initialSetups(tables: ImportTableDTO[], kindOf: (therapistId: string) => Kind, fallbackService: string): Record<string, TableSetup> {
  const latest = periodOf(bestTable(tables));
  const now = new Date();
  return Object.fromEntries(tables.map(t => {
    const mapping = initialMapping(t);
    const matched = Object.values(mapping).filter(Boolean).length;
    const setup: TableSetup = {
      include: !!t.serviceId && periodOf(t) === latest && matched >= 2,
      serviceId: t.serviceId ?? fallbackService,
      year: t.year ?? now.getFullYear(), month: t.month ?? now.getMonth(),
      mapping,
      kinds: Object.fromEntries(t.people.map(p => [p.row, mapping[p.row] ? kindOf(mapping[p.row]) : 'fija'])),
      hours: Object.fromEntries(t.people.map(p => [p.row, p.hours ? p.hours : null]))
    };
    return [t.id, setup];
  }));
}

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
export const membersOf = (t: ImportTableDTO, s: Pick<TableSetup, 'mapping' | 'kinds' | 'hours'>) =>
  t.people.filter(p => s.mapping[p.row]).map(p => {
    const targetHours = s.hours[p.row];
    return { therapistId: s.mapping[p.row], cells: p.cells, kind: s.kinds[p.row] ?? 'fija', ...(typeof targetHours === 'number' ? { targetHours } : {}) };
  });

/**
 * Qué impide importar una tabla marcada (null = se puede). `exists` dice si ya hay un cuadro de ese servicio y mes.
 * `taken` son los servicio+mes que ya reservó otra tabla marcada del mismo archivo.
 */
export function problemOf(t: ImportTableDTO, s: TableSetup, exists: boolean, taken: Set<string>): string | null {
  const sum = summarize(t, s.mapping);
  if (!s.serviceId) return 'Elige el servicio.';
  if (sum.duplicated) return 'Una persona del directorio solo puede elegirse una vez.';
  if (sum.selected < 2) return 'Elige al menos 2 personas.';
  if (exists) return 'Ya existe un cuadro de este servicio en ese mes.';
  if (taken.has(`${s.serviceId}|${s.year}|${s.month}`)) return 'Otra tabla marcada es del mismo servicio y mes.';
  if (s.hours && Object.values(s.hours).some(h => h !== null && (h < 0 || h > 744))) return 'Una meta de horas no es válida (0 a 744).';
  return null;
}
