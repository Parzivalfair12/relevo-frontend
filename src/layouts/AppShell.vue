<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import BrandLogo from '@/components/BrandLogo.vue';
import { useAuth } from '@/stores/auth';
import { initials } from '@/lib/format';

const auth = useAuth(), route = useRoute(), router = useRouter();
const tabs = computed(() => [
  { to: '/', key: 'dash', label: 'Resumen' },
  { to: '/schedules', key: 'schedules', label: 'Cuadros' },
  { to: '/team', key: 'team', label: 'Equipo' },
  ...(auth.isAdmin ? [{ to: '/admin', key: 'admin', label: 'Administración' }] : [])
]);
async function logout() { await auth.logout(); router.push({ name: 'login' }); }
</script>

<template>
  <div class="wrap">
    <header class="top">
      <div class="brand"><BrandLogo />Turnos Respiratoria</div>
      <nav class="tabs nav" aria-label="Secciones">
        <RouterLink v-for="t in tabs" :key="t.key" :to="t.to" class="tab tab-link" :aria-current="route.meta.tab === t.key ? 'page' : undefined">{{ t.label }}</RouterLink>
      </nav>
      <div class="sp"></div>
      <div class="me" v-if="auth.user">
        <span class="av">{{ initials(auth.user.name) }}</span>
        <div><b>{{ auth.user.name }}</b><small><span class="rolepill" :class="{ co: !auth.isAdmin }">{{ auth.roleLabel }}</span></small></div>
        <button class="btn sm" @click="logout">Salir</button>
      </div>
    </header>
    <RouterView />
  </div>
</template>

<style>
/* Las pestañas del mockup son <button aria-selected>; aquí son enlaces, y en un enlace lo válido es aria-current: mismo estilo, mismos valores */
.tab-link { text-decoration: none; display: inline-block; }
.tab-link[aria-current="page"] { background: var(--accent); color: var(--accent-ink); }
</style>
