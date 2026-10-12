import { defineStore } from 'pinia';
import type { ScheduleIndexItemDTO, ScheduleSummaryDTO } from '@/shared';
import { api } from '@/lib/api';

/** Cuántos meses hacia atrás se ven al abrir la pantalla Cuadros (el mes actual y los 5 anteriores), y cuántos se suman con «Mostrar anteriores». */
export const WINDOW_MONTHS = 6;
const keyOf = (c: { year: number; month: number }) => c.year * 12 + c.month;
const ym = (k: number) => `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`;

/**
 * Cuadros que ve la usuaria. Las tarjetas (`list`) cubren solo una ventana de meses: del mes de `fromKey` en adelante, para no
 * cargar años de histórico. El índice (`index`) es liviano (servicio, mes y estado de TODOS los cuadros visibles, sin turnos):
 * sirve para los períodos del resumen y para saber si ya existe un cuadro al importar.
 */
export const useSchedules = defineStore('schedules', {
  state: () => ({ list: [] as ScheduleSummaryDTO[], index: [] as ScheduleIndexItemDTO[], loaded: false, indexLoaded: false, fromKey: 0 }),
  getters: {
    /** ¿Hay cuadros más viejos que la ventana? */
    olderCount: st => st.index.filter(c => keyOf(c) < st.fromKey).length
  },
  actions: {
    async loadIndex() { this.index = await api<ScheduleIndexItemDTO[]>('/schedules/index'); this.indexLoaded = true; },
    /** Carga el índice y las tarjetas de la ventana actual (la primera vez, desde hace 5 meses). */
    async load() {
      if (!this.fromKey) { const d = new Date(); this.fromKey = d.getFullYear() * 12 + d.getMonth() - (WINDOW_MONTHS - 1); }
      const [cards] = await Promise.all([api<ScheduleSummaryDTO[]>(`/schedules?from=${ym(this.fromKey)}`), this.loadIndex()]);
      this.list = cards; this.loaded = true;
    },
    /** Amplía la ventana unos meses hacia atrás y vuelve a cargar las tarjetas. */
    async showOlder() {
      this.fromKey -= WINDOW_MONTHS;
      this.list = await api<ScheduleSummaryDTO[]>(`/schedules?from=${ym(this.fromKey)}`);
    }
  }
});
