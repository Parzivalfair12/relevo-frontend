import { defineStore } from 'pinia';
import type { ServiceDTO, TherapistDTO, UserDTO } from '@/shared';
import { api } from '@/lib/api';

export interface TherapistFilters { q?: string; service?: string; kind?: string; active?: string }

/** Servicios, terapeutas y usuarios (estos últimos solo los carga el administrador). */
export const useDirectory = defineStore('directory', {
  state: () => ({ services: [] as ServiceDTO[], therapists: [] as TherapistDTO[], users: [] as UserDTO[], tReq: 0 }),
  getters: {
    service: s => (id: string) => s.services.find(x => x.id === id)
  },
  actions: {
    async loadServices() { this.services = await api<ServiceDTO[]>('/services'); },
    async loadUsers() { this.users = await api<UserDTO[]>('/users'); },
    /** Si dos consultas se cruzan (escribiendo rápido), solo vale la última. */
    async loadTherapists(f: TherapistFilters = {}) {
      const n = ++this.tReq;
      const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
      const list = await api<TherapistDTO[]>('/therapists' + (qs ? `?${qs}` : ''));
      if (n === this.tReq) this.therapists = list;
    }
  }
});
