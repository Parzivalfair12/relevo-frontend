import { defineStore } from 'pinia';
import type { ScheduleSummaryDTO } from '@/shared';
import { api } from '@/lib/api';

/** Lista de cuadros visibles para la usuaria (tarjetas de la pantalla Cuadros). */
export const useSchedules = defineStore('schedules', {
  state: () => ({ list: [] as ScheduleSummaryDTO[], loaded: false }),
  actions: {
    async load() { this.list = await api<ScheduleSummaryDTO[]>('/schedules'); this.loaded = true; }
  }
});
