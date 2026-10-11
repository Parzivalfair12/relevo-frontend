import { describe, expect, it } from 'vitest';
import type { NewScheduleOptionDTO, NewScheduleProposalDTO } from '@/shared';
import { chosen, countKinds, effectiveHours, goalTotal, initialPlan, neededHours, overlaps, problemOf, teamPayload, type Plan } from './newSchedule';

const opt = (id: string, over: Partial<NewScheduleOptionDTO> = {}): NewScheduleOptionDTO =>
  ({ therapistId: id, name: id.toUpperCase(), inService: true, selected: true, kind: 'fija', targetHours: null, elsewhere: [], ...over });
const proposal = (options: NewScheduleOptionDTO[]): NewScheduleProposalDTO => ({ exists: false, hasPrevious: true, days: 30, coverage: { M: 1, T: 1, N: 1 }, options });

describe('nuevo cuadro: plan inicial', () => {
  it('sin metas en el mes anterior las horas son automáticas', () => {
    const p = initialPlan(proposal([opt('a'), opt('b'), opt('c', { selected: false })]));
    expect(p).toMatchObject({ mode: 'auto', goal: null });
    expect(chosen(p).map(r => r.therapistId)).toEqual(['a', 'b']);
  });
  it('con metas propone la más repetida como meta del cuadro y deja la diferente como ajuste de esa persona', () => {
    const p = initialPlan(proposal([opt('a', { targetHours: 100 }), opt('b', { targetHours: 100 }), opt('c', { targetHours: 120 }), opt('d', { kind: 'apoyo', targetHours: 80 })]));
    expect(p).toMatchObject({ mode: 'goal', goal: 100 });
    expect(p.rows.map(r => r.override)).toEqual([null, null, 120, null]);
    expect(p.rows.map(r => effectiveHours(p, r))).toEqual([100, 100, 120, null]); // el apoyo no lleva meta
  });
  it('ignora las metas de quienes no se marcaron', () => {
    const p = initialPlan(proposal([opt('a', { selected: false, targetHours: 200 }), opt('b'), opt('c')]));
    expect(p.mode).toBe('auto');
  });
});

describe('nuevo cuadro: validación y envío', () => {
  const plan = (over: Partial<Plan>): Plan => ({ mode: 'auto', goal: null, rows: initialPlan(proposal([opt('a'), opt('b'), opt('c', { kind: 'apoyo' })])).rows, ...over });
  it('pide al menos 2 terapeutas', () => {
    const p = plan({}); p.rows[0].selected = false; p.rows[1].selected = false;
    expect(problemOf(p)).toBe('min');
  });
  it('con meta del cuadro exige un valor entre 0 y 744 para la planta', () => {
    expect(problemOf(plan({ mode: 'goal', goal: null }))).toBe('goal');
    expect(problemOf(plan({ mode: 'goal', goal: 745 }))).toBe('range');
    expect(problemOf(plan({ mode: 'goal', goal: -1 }))).toBe('range');
    expect(problemOf(plan({ mode: 'goal', goal: 0 }))).toBeNull();
    expect(problemOf(plan({ mode: 'goal', goal: 150 }))).toBeNull();
  });
  it('en automático no envía metas', () => {
    expect(teamPayload(plan({}))).toEqual([{ therapistId: 'a', kind: 'fija' }, { therapistId: 'b', kind: 'fija' }, { therapistId: 'c', kind: 'apoyo' }]);
  });
  it('con meta envía la del cuadro a la planta, el ajuste a quien lo tenga y nada al apoyo', () => {
    const p = plan({ mode: 'goal', goal: 100 }); p.rows[1].override = 140;
    expect(teamPayload(p)).toEqual([{ therapistId: 'a', kind: 'fija', targetHours: 100 }, { therapistId: 'b', kind: 'fija', targetHours: 140 }, { therapistId: 'c', kind: 'apoyo' }]);
    expect(goalTotal(p)).toBe(240);
  });
  it('cambiar una persona a apoyo le quita la meta', () => {
    const p = plan({ mode: 'goal', goal: 100 }); p.rows[0].kind = 'apoyo';
    expect(effectiveHours(p, p.rows[0])).toBeNull();
    expect(countKinds(p)).toEqual({ planta: 1, apoyo: 2 });
  });
});

describe('nuevo cuadro: referencias', () => {
  it('las horas que pide la cobertura salen de 6 h de mañana y tarde y 12 h de noche por día', () => {
    expect(neededHours({ M: 1, T: 1, N: 1 }, 30)).toBe(720);
    expect(neededHours({ M: 2, T: 1, N: 1 }, 31)).toBe(930);
  });
  it('avisa de quién elegida ya está en otro servicio ese mes', () => {
    const p = initialPlan(proposal([opt('a', { elsewhere: ['UCI'] }), opt('b'), opt('c', { selected: false, elsewhere: ['Urgencias'] })]));
    expect(overlaps(p)).toEqual([{ name: 'A', services: ['UCI'] }]);
  });
});
