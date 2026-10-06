<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import BrandLogo from '@/components/BrandLogo.vue';
import LangToggle from '@/components/LangToggle.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import WelcomeDialog from '@/components/WelcomeDialog.vue';
import { useAuth } from '@/stores/auth';
import { initials } from '@/lib/format';

const auth = useAuth(), route = useRoute(), router = useRouter();
const { t } = useI18n();

/** La bienvenida sale una vez por persona y navegador; el botón «?» la vuelve a abrir. */
const welcomeKey = () => `relevo.welcome.${auth.user?.id ?? ''}`;
const welcome = ref(false);
onMounted(() => {
  try { welcome.value = !!auth.user && localStorage.getItem(welcomeKey()) !== '1'; } catch { welcome.value = !!auth.user; }
});
function closeWelcome() {
  welcome.value = false;
  try { localStorage.setItem(welcomeKey(), '1'); } catch { /* se volverá a mostrar en la próxima visita */ }
}
function goWelcome(to: 'new' | 'import') {
  closeWelcome();
  router.push({ name: 'schedules', query: { [to]: '1' } });
}
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
      <div class="brand"><BrandLogo word /></div>
      <nav class="tabs nav" aria-label="Secciones">
        <RouterLink v-for="t in tabs" :key="t.key" :to="t.to" class="tab tab-link" :aria-current="route.meta.tab === t.key ? 'page' : undefined">{{ t.label }}</RouterLink>
      </nav>
      <div class="sp"></div>
      <button type="button" class="icon-btn" :aria-label="t('welcome.helpButton')" :title="t('welcome.helpButton')" @click="welcome = true"><b>?</b></button>
      <LangToggle /><ThemeToggle />
      <div class="me" v-if="auth.user">
        <span class="av">{{ initials(auth.user.name) }}</span>
        <div><b>{{ auth.user.name }}</b><small><span class="rolepill" :class="{ co: !auth.isAdmin }">{{ auth.roleLabel }}</span></small></div>
        <button class="btn sm" @click="logout">Salir</button>
      </div>
    </header>
    <RouterView />
    <WelcomeDialog v-if="welcome" @close="closeWelcome" @go="goWelcome" />
  </div>
</template>

<style>
/* Las pestañas del mockup son <button aria-selected>; aquí son enlaces, y en un enlace lo válido es aria-current: mismo estilo, mismos valores */
.tab-link { text-decoration: none; display: inline-block; }
.tab-link[aria-current="page"] { background: var(--accent); color: var(--accent-ink); }
</style>
