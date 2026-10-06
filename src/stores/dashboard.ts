import { defineStore } from 'pinia';
import type { DashboardDTO, DashboardTherapistDetail } from '@/shared';
import { api } from '@/lib/api';

export interface DashQuery { service: string; from: string; to: string }
const qs = (q: DashQuery) => new URLSearchParams({ ...(q.service !== 'all' ? { service: q.service } : {}), from: q.from, to: q.to }).toString();

/** Resumen de turnos: lo calcula el servidor con los cuadros del período y los servicios que la usuaria puede ver. */
export const useDashboard = defineStore('dashboard', {
  state: () => ({ data: null as DashboardDTO | null, req: 0 }),
  actions: {
    /** Si dos consultas se cruzan (cambiar filtros rápido), solo vale la última. */
    async load(q: DashQuery) {
      const n = ++this.req;
      const d = await api<DashboardDTO>(`/dashboard?${qs(q)}`);
      if (n === this.req) this.data = d;
    },
    detail(id: string, q: DashQuery) { return api<DashboardTherapistDetail>(`/dashboard/therapists/${id}?${qs(q)}`); }
  }
});
