/** Funciones puras del editor de cuadros. Usan el motor copiado del backend (@/engine) solo para validar y calcular metas. */
import { HRS, daysIn, isWeekend, targets, validate, type Cell, type Config, type Grid, type Issue } from '@/engine';
import { DIAS_SEMANA, SHIFT_DESC, SHIFT_NAME, type ScheduleDTO, type ScheduleMemberDTO, type ShiftCode } from '@/shared';

export const OFF = ['V', 'I', 'P'];
export const isWork = (c: string | undefined) => c === 'M' || c === 'T' || c === 'N' || c === 'MT';
export const isOff = (c: string | undefined) => !!c && OFF.includes(c);
export const dowOf = (y: number, m: number, d: number) => new Date(y, m, d).getDay(); // 0 = domingo
export const dayLetter = (y: number, m: number, d: number) => DIAS_SEMANA[dowOf(y, m, d)];
export { HRS, daysIn, isWeekend, SHIFT_DESC, SHIFT_NAME };
export const firstName = (name: string) => name.split(' ')[0];
export const shortName = (name: string) => `${firstName(name)} ${(name.split(' ')[1] || '')[0] || ''}.`;

export const hoursOfRow = (days: Cell[]) => days.reduce((a, c) => a + (HRS[c] || 0), 0);
export const lockedCount = (s: ScheduleDTO) => s.members.reduce((a, m) => a + Object.keys(m.locked).length, 0);

/** Rangos de ausencia (días 1 a n) reconstruidos desde las casillas fijadas V/I/P. */
export function absRanges(m: ScheduleMemberDTO, n: number) {
  const out: { code: ShiftCode; from: number; to: number }[] = [];
  let cur: (typeof out)[number] | null = null;
  for (let d = 0; d < n; d++) {
    const c = m.locked[d];
    if (c && isOff(c)) {
      if (cur && cur.code === c && cur.to === d) cur.to = d + 1;
      else { cur = { code: c, from: d + 1, to: d + 1 }; out.push(cur); }
    } else cur = null;
  }
  return out;
}
export const absDays = (m: ScheduleMemberDTO, n: number) => absRanges(m, n).reduce((a, r) => a + r.to - r.from + 1, 0);

export function configOf(s: ScheduleDTO): Config {
  return {
    year: s.year, month: s.month, cov: s.coverage, rules: s.rules, seed: s.seed, prev: s.prev,
    staff: s.members.map(m => ({ id: m.therapistId, name: m.name, kind: m.kind, targetHours: m.targetHours })),
    locked: Object.fromEntries(s.members.map(m => [m.therapistId, m.locked]))
  };
}
export const gridOf = (s: ScheduleDTO): Grid => Object.fromEntries(s.members.map(m => [m.therapistId, m.days]));

/** Cruces con otros cuadros del mismo mes: el servidor manda `busy` (terapeuta → día → servicio). */
export function conflictIssues(s: ScheduleDTO): Issue[] {
  const out: Issue[] = [];
  for (const m of s.members) {
    const b = s.busy[m.therapistId]; if (!b) continue;
    m.days.forEach((c, d) => { if (isWork(c) && b[d]) out.push({ id: m.therapistId, day: d + 1, sev: 'err', msg: `${m.name}: el día ${d + 1} también trabaja en ${b[d]}` }); });
  }
  return out;
}
/** Alertas en vivo: reglas del motor + cruces. */
export const issuesOf = (s: ScheduleDTO): Issue[] => validate(configOf(s), gridOf(s)).concat(conflictIssues(s));
export const targetsOf = (s: ScheduleDTO) => targets(configOf(s), gridOf(s));

export const nightsOf = (days: Cell[]) => days.filter(x => x === 'N').length;
export const weekendWorkOf = (days: Cell[], y: number, m: number) => days.filter((x, i) => isWork(x) && isWeekend(y, m, i + 1)).length;

/** Opciones de mes para «Nuevo cuadro»: tres meses atrás hasta cinco adelante, con el mes actual por defecto. */
export function monthOptions(now = new Date()) {
  const base = now.getFullYear() * 12 + now.getMonth();
  return Array.from({ length: 9 }, (_, i) => { const t = base - 3 + i; return { year: Math.floor(t / 12), month: t % 12, current: i === 3 }; });
}

/** Texto TSV para pegar en Excel: nombres, un código por día (el libre queda vacío) y las horas. */
export function toTsv(s: ScheduleDTO): string {
  const n = daysIn(s.year, s.month);
  const ordered = s.members.filter(m => m.kind === 'fija').concat(s.members.filter(m => m.kind === 'apoyo'));
  let tsv = ['Terapeuta', ...Array.from({ length: n }, (_, i) => String(i + 1)), 'Horas'].join('\t') + '\n';
  for (const m of ordered) tsv += [m.name, ...m.days.map(c => (c === 'L' ? '' : c)), String(hoursOfRow(m.days))].join('\t') + '\n';
  return tsv;
}
