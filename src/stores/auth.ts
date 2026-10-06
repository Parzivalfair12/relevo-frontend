import { defineStore } from 'pinia';
import type { UserDTO } from '@/shared';
import { t } from '@/i18n';
import { api, post, refreshSession, setAccessToken } from '@/lib/api';

export const useAuth = defineStore('auth', {
  state: () => ({ user: null as UserDTO | null, ready: false }),
  getters: {
    isAdmin: s => s.user?.role === 'admin',
    roleLabel: s => (s.user?.role === 'admin' ? t('auth.role.admin') : t('auth.role.coordinator'))
  },
  actions: {
    /** Se llama una vez al arrancar: intenta recuperar la sesión con la cookie de renovación. */
    async init() {
      try { this.user = (await refreshSession()) ? await api<UserDTO>('/auth/me') : null; }
      catch { this.user = null; }
      this.ready = true;
    },
    async login(email: string, password: string) {
      const r = await post<{ accessToken: string; user: UserDTO }>('/auth/login', { email, password });
      setAccessToken(r.accessToken); this.user = r.user;
    },
    async register(name: string, email: string, password: string) { await post('/auth/register', { name, email, password }); },
    async logout() { try { await post('/auth/logout'); } catch { /* ya sin sesión */ } this.clear(); },
    /** Sesión perdida o cerrada: limpia el estado local. */
    clear() { setAccessToken(null); this.user = null; }
  }
});
