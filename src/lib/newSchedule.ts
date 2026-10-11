import type { Coverage, Kind, NewScheduleProposalDTO } from '@/shared';
import { HRS } from '@/lib/schedule';

/** Una terapeuta en el diálogo «Nuevo cuadro». `override` es la meta de esta persona cuando difiere de la del cuadro. */
export interface PlanRow { therapistId: string; name: string; inService: boolean; selected: boolean; kind: Kind; override: number | null; elsewhere: string[] }
/** `auto`: el motor reparte las horas; `goal`: cada persona de planta lleva una meta mensual (la del cuadro o la suya). */
export interface Plan { mode: 'auto' | 'goal'; goal: number | null; rows: PlanRow[] }
export type PlanProblem = 'min' | 'goal' | 'range' | null;

export const MAX_HOURS = 744;

/** Parte de la propuesta del servidor: si el mes anterior tenía metas, se propone la más repetida como meta del cuadro. */
export function initialPlan(p: NewScheduleProposalDTO): Plan {
  const rows: PlanRow[] = p.options.map(o => ({ therapistId: o.therapistId, name: o.name, inService: o.inService, selected: o.selected, kind: o.kind, override: null, elsewhere: o.elsewhere }));
  const goals = p.options.filter(o => o.selected && o.kind === 'fija' && o.targetHours !== null).map(o => o.targetHours as number);
  if (!goals.length) return { mode: 'auto', goal: null, rows };
  const count = new Map<number, number>();
  for (const g of goals) count.set(g, (count.get(g) ?? 0) + 1);
  const goal = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  p.options.forEach((o, i) => { if (o.selected && o.kind === 'fija' && o.targetHours !== null && o.targetHours !== goal) rows[i].override = o.targetHours; });
  return { mode: 'goal', goal, rows };
}

export const chosen = (plan: Plan) => plan.rows.filter(r => r.selected);
/** La meta que llevará la persona; el apoyo nunca lleva meta (completa lo que falte). */
export const effectiveHours = (plan: Plan, r: PlanRow): number | null => (plan.mode === 'goal' && r.kind === 'fija' ? r.override ?? plan.goal : null);

export function problemOf(plan: Plan): PlanProblem {
  const team = chosen(plan);
  if (team.length < 2) return 'min';
  if (plan.mode !== 'goal') return null;
  for (const r of team) {
    const h = effectiveHours(plan, r);
    if (r.kind !== 'fija') continue;
    if (h === null || Number.isNaN(h)) return 'goal';
    if (h < 0 || h > MAX_HOURS) return 'range';
  }
  return null;
}

/** El `team` que recibe `POST /schedules`: solo las marcadas, con su tipo y, si hay meta, sus horas. */
export const teamPayload = (plan: Plan) => chosen(plan).map(r => {
  const h = effectiveHours(plan, r);
  return { therapistId: r.therapistId, kind: r.kind, ...(h !== null ? { targetHours: h } : {}) };
});

/** Horas que pide la cobertura en un mes de `days` días. */
export const neededHours = (cov: Coverage, days: number) => (cov.M * HRS.M + cov.T * HRS.T + cov.N * HRS.N) * days;
/** Suma de las metas de la planta elegida (0 si las horas son automáticas). */
export const goalTotal = (plan: Plan) => chosen(plan).reduce((a, r) => a + (effectiveHours(plan, r) ?? 0), 0);
export const countKinds = (plan: Plan) => {
  const team = chosen(plan);
  return { planta: team.filter(r => r.kind === 'fija').length, apoyo: team.filter(r => r.kind === 'apoyo').length };
};
/** Elegidas que ya están en un cuadro de otro servicio ese mes (se cruzarían si trabajan el mismo día). */
export const overlaps = (plan: Plan) => chosen(plan).filter(r => r.elsewhere.length > 0).map(r => ({ name: r.name, services: r.elsewhere }));
