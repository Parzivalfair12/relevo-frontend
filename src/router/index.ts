import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/stores/auth';

declare module 'vue-router' { interface RouteMeta { public?: boolean; admin?: boolean; tab?: string } }

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    {
      path: '/', component: () => import('@/layouts/AppShell.vue'),
      children: [
        { path: '', name: 'dash', component: () => import('@/views/DashboardView.vue'), meta: { tab: 'dash' } },
        { path: 'schedules', name: 'schedules', component: () => import('@/views/SchedulesView.vue'), meta: { tab: 'schedules' } },
        { path: 'schedules/:id', name: 'editor', component: () => import('@/views/ScheduleEditorView.vue'), meta: { tab: 'schedules' } },
        { path: 'team', name: 'team', component: () => import('@/views/TeamView.vue'), meta: { tab: 'team' } },
        { path: 'admin', name: 'admin', component: () => import('@/views/AdminView.vue'), meta: { tab: 'admin', admin: true } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

router.beforeEach(async to => {
  const auth = useAuth();
  if (!auth.ready) await auth.init();
  if (!to.meta.public && !auth.user) return { name: 'login' };
  if (to.name === 'login' && auth.user) return { name: 'dash' };
  if (to.meta.admin && !auth.isAdmin) return { name: 'dash' }; // la API también lo exige: esto es solo comodidad
});
