import { defineStore } from 'pinia';
import type { Kind, Rules, ScheduleDTO, ShiftCode, VersionConflictDetails } from '@/shared';
import { ApiException, api, del, errorText, patch, post, put } from '@/lib/api';
import { toast } from '@/lib/toast';
import { daysIn, issuesOf, targetsOf } from '@/lib/schedule';

/** Una persona del equipo tal como la espera PATCH /schedules/:id */
interface TeamEntry { therapistId: string; kind: Kind; targetHours?: number | null }
export type Brush = 'sel' | 'erase' | ShiftCode;
interface Change { therapistId: string; day: number; code: ShiftCode | null }

/**
 * Editor de un cuadro. Pintar es local e inmediato (alertas en vivo con el motor) y se guarda en lote tras ~800 ms.
 * Lo que recalcula el cuadro (reglas, cobertura, equipo, ausencias, generar) va al servidor, que lo hace en un worker.
 * Todas las llamadas se encolan para que cada una use la versión que dejó la anterior.
 */
let chain: Promise<unknown> = Promise.resolve();
const enqueue = <T>(fn: () => Promise<T>): Promise<T> => { const run = chain.then(fn); chain = run.catch(() => undefined); return run; };
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const SAVE_DELAY = 800;
const key = (c: Change) => `${c.therapistId}:${c.day}`;

function applyLocal(s: ScheduleDTO, c: Change) {
  const m = s.members.find(x => x.therapistId === c.therapistId); if (!m) return;
  if (c.code) { m.locked[c.day] = c.code; m.days[c.day] = c.code; } else delete m.locked[c.day];
}

export const useEditor = defineStore('editor', {
  state: () => ({
    s: null as ScheduleDTO | null, brush: 'sel' as Brush, step: 0,
    pending: {} as Record<string, Change>,
    /** Conflicto de versión: otra persona guardó antes. Mientras exista, no se guarda nada. */
    conflict: null as null | { by?: string },
    working: false
  }),
  getters: {
    n: st => (st.s ? daysIn(st.s.year, st.s.month) : 0),
    issues: st => (st.s ? issuesOf(st.s) : []),
    tg: st => (st.s ? targetsOf(st.s) : {}),
    fijas: st => (st.s ? st.s.members.filter(m => m.kind === 'fija') : []),
    apoyo: st => (st.s ? st.s.members.filter(m => m.kind === 'apoyo') : []),
    hasPending: st => Object.keys(st.pending).length > 0
  },
  actions: {
    async open(id: string) {
      clearTimeout(saveTimer);
      this.$patch({ s: null, brush: 'sel', step: 0, pending: {}, conflict: null, working: false });
      this.s = await api<ScheduleDTO>(`/schedules/${id}`);
    },
    close() { clearTimeout(saveTimer); this.s = null; this.pending = {}; this.conflict = null; },

    /** Pone el cuadro que devolvió el servidor y vuelve a aplicar encima lo que se pintó mientras tanto. */
    adopt(dto: ScheduleDTO) { for (const c of Object.values(this.pending)) applyLocal(dto, c); this.s = dto; },
    fail(e: unknown) {
      if (e instanceof ApiException && e.status === 409 && e.body.code === 'VERSION_CONFLICT') this.conflict = { by: (e.body.details as VersionConflictDetails | undefined)?.updatedByName };
      else toast(errorText(e));
    },

    /* ---- pintar (local) ---- */
    paint(therapistId: string, day: number, code: ShiftCode) {
      if (!this.s || this.conflict) return;
      const c: Change = { therapistId, day, code };
      applyLocal(this.s, c); this.pending[key(c)] = c;
      this.step = Math.max(this.step, 4);
      this.scheduleSave();
    },
    /** Goma: suelta una casilla fijada. Devuelve true si había algo que soltar (hay que recalcular al terminar). */
    erase(therapistId: string, day: number): boolean {
      const m = this.s?.members.find(x => x.therapistId === therapistId);
      if (!m || m.locked[day] == null || this.conflict) return false;
      const c: Change = { therapistId, day, code: null };
      applyLocal(this.s!, c); this.pending[key(c)] = c;
      return true;
    },
    scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { void this.flush(); }, SAVE_DELAY); },
    /** Guarda ya lo pendiente (también se llama antes de salir de la pantalla). */
    flush() { clearTimeout(saveTimer); return enqueue(() => this.doFlush()).catch(() => undefined); },
    async doFlush() {
      const s = this.s;
      if (!s || this.conflict || !this.hasPending) return;
      const sent = this.pending; this.pending = {};
      try { this.adopt(await put<ScheduleDTO>(`/schedules/${s.id}/cells`, { version: s.version, changes: Object.values(sent) })); }
      catch (e) { this.pending = { ...sent, ...this.pending }; this.fail(e); throw e; }
    },

    /* ---- recargar tras un conflicto sin perder las casillas pendientes ---- */
    async refetch() {
      if (!this.s) return;
      this.adopt(await api<ScheduleDTO>(`/schedules/${this.s.id}`));
    },
    async reloadAfterConflict() {
      this.conflict = null;
      try { await this.refetch(); } catch (e) { this.fail(e); return; }
      await this.flush();
    },

    /* ---- operaciones que recalculan en el servidor ---- */
    run(op: (s: ScheduleDTO) => Promise<ScheduleDTO>): Promise<ScheduleDTO | null> {
      return enqueue(async () => {
        try { await this.doFlush(); } catch { /* conflicto o red: más abajo se decide si seguir */ }
        if (!this.s || this.conflict) return null;
        this.working = true;
        try { const dto = await op(this.s); this.adopt(dto); return dto; }
        catch (e) { this.fail(e); if (!this.conflict) await this.refetch().catch(() => undefined); return null; }
        finally { this.working = false; }
      });
    },
    generate(variant = false) { return this.run(s => post<ScheduleDTO>(`/schedules/${s.id}/generate`, { version: s.version, variant })); },
    /** `optimistic` se aplica al instante (el control responde ya); el servidor confirma o, si falla, se vuelve a leer. */
    patchSchedule(body: Record<string, unknown>, optimistic?: () => void) {
      optimistic?.();
      return this.run(s => patch<ScheduleDTO>(`/schedules/${s.id}`, { version: s.version, ...body }));
    },
    setStatus(status: 'bor' | 'pub') { return this.patchSchedule({ status }); },
    setRules(changes: Partial<Rules>) {
      return this.patchSchedule({ rules: { ...this.s!.rules, ...changes } }, () => { Object.assign(this.s!.rules, changes); });
    },
    setCoverage(k: 'M' | 'T' | 'N', delta: number) {
      const v = Math.max(0, Math.min(4, this.s!.coverage[k] + delta));
      return this.patchSchedule({ coverage: { ...this.s!.coverage, [k]: v } }, () => { this.s!.coverage[k] = v; });
    },
    team(mod: (t: TeamEntry[]) => TeamEntry[]) {
      return this.patchSchedule({ team: mod(this.s!.members.map(m => ({ therapistId: m.therapistId, kind: m.kind, targetHours: m.targetHours }))) });
    },
    addMember(therapistId: string, kind: Kind) { return this.team(t => [...t, { therapistId, kind, targetHours: null }]); },
    /** Meta mensual de horas de una persona; null = que se reparta sola. Recalcula lo que no está fijado. */
    setTarget(therapistId: string, targetHours: number | null) { return this.team(t => t.map(x => (x.therapistId === therapistId ? { ...x, targetHours } : x))); },
    removeMember(therapistId: string) { return this.team(t => t.filter(x => x.therapistId !== therapistId)); },
    setKind(therapistId: string, kind: Kind) { return this.team(t => t.map(x => (x.therapistId === therapistId ? { ...x, kind } : x))); },
    addAbsence(a: { therapistId: string; code: 'V' | 'I' | 'P'; from: number; to: number }) {
      return this.run(s => post<ScheduleDTO>(`/schedules/${s.id}/absences`, { version: s.version, ...a }));
    },
    removeAbsence(a: { therapistId: string; from: number; to: number }) {
      return this.run(s => del<ScheduleDTO>(`/schedules/${s.id}/absences?version=${s.version}&therapistId=${a.therapistId}&from=${a.from}&to=${a.to}`));
    },
    /** Suelta una casilla fijada desde el menú: el servidor recalcula. */
    unlock(therapistId: string, day: number) {
      return this.run(s => put<ScheduleDTO>(`/schedules/${s.id}/cells`, { version: s.version, changes: [{ therapistId, day, code: null }] }));
    },
    unlockAll() {
      return this.run(s => {
        const changes = s.members.flatMap(m => Object.keys(m.locked).map(d => ({ therapistId: m.therapistId, day: Number(d), code: null })));
        return put<ScheduleDTO>(`/schedules/${s.id}/cells`, { version: s.version, changes });
      });
    }
  }
});
