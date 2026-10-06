<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MESES } from '@/shared';
import ImportScheduleDialog from '@/components/ImportScheduleDialog.vue';
import NewScheduleDialog from '@/components/NewScheduleDialog.vue';
import PageHead from '@/components/PageHead.vue';
import { errorText } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuth } from '@/stores/auth';
import { useDirectory } from '@/stores/directory';
import { useSchedules } from '@/stores/schedules';

const auth = useAuth(), dir = useDirectory(), store = useSchedules(), router = useRouter(), route = useRoute();
const svc = ref('all'), st = ref('all'), creating = ref(false), importing = ref(false);

/** El administrador ve todos los servicios; la coordinadora, los que tiene asignados. */
const services = computed(() => (auth.isAdmin ? dir.services : dir.services.filter(s => auth.user?.serviceIds.includes(s.id))));
const cards = computed(() => store.list.filter(c => (svc.value === 'all' || c.serviceId === svc.value) && (st.value === 'all' || c.status === st.value)));
const svcOf = (id: string) => dir.service(id) ?? { name: 'Servicio eliminado', color: '#999999' };

onMounted(async () => {
  try { await Promise.all([dir.loadServices(), dir.loadTherapists({ active: 'true' }), store.load()]); }
  catch (e) { toast(errorText(e)); }
  // La bienvenida manda aquí con ?new=1 o ?import=1 para abrir el diálogo que se eligió
  const want = route.query.new ? 'new' : route.query.import ? 'import' : null;
  if (want) { await router.replace({ name: 'schedules' }); if (want === 'new') openNew(); else openImport(); }
});
function openNew() {
  if (!services.value.length) return toast('No tienes servicios asignados. Pídele a un administrador que te asigne uno.');
  creating.value = true;
}
function openImport() {
  if (!services.value.length) return toast('No tienes servicios asignados. Pídele a un administrador que te asigne uno.');
  importing.value = true;
}
</script>

<template>
  <main>
    <PageHead title="Cuadros" :subtitle="auth.isAdmin ? 'Todos los servicios. Un cuadro por servicio y por mes.' : 'Los servicios que tienes asignados. Un cuadro por servicio y por mes.'">
      <button class="btn" @click="openImport">↑ Importar cuadro</button>
      <button class="btn primary" @click="openNew">＋ Nuevo cuadro</button>
    </PageHead>
    <div class="filters">
      <select v-model="svc" aria-label="Servicio"><option value="all">Todos los servicios</option><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select>
      <select v-model="st" aria-label="Estado"><option value="all">Todos los estados</option><option value="bor">Borradores</option><option value="pub">Publicados</option></select>
    </div>
    <div class="cards">
      <button class="qc new" @click="openNew"><i>＋</i>Nuevo cuadro</button>
      <button class="qc" v-for="c in cards" :key="c.id" @click="router.push({ name: 'editor', params: { id: c.id } })">
        <div class="tops"><span class="st-pill" :class="c.status">{{ c.status === 'pub' ? 'Publicado' : 'Borrador' }}</span><span class="meta">{{ c.days }} días</span></div>
        <div><h3><span class="svdot" :style="{ background: svcOf(c.serviceId).color }"></span>{{ svcOf(c.serviceId).name }}</h3><div class="meta">{{ MESES[c.month] }} {{ c.year }} · {{ c.ownerName }}</div></div>
        <div class="nums">
          <div><b>{{ c.totalHours }} h</b><span>de {{ c.neededHours }} h</span></div>
          <div><b>{{ c.planta }}+{{ c.apoyo }}</b><span>planta + apoyo</span></div>
          <div><b :style="{ color: c.criticalAlerts ? 'var(--err)' : 'var(--ok)' }">{{ c.criticalAlerts }}</b><span>alertas críticas</span></div>
        </div>
      </button>
    </div>
    <NewScheduleDialog v-if="creating" :services="services" @close="creating = false" />
    <ImportScheduleDialog v-if="importing" :services="services" @close="importing = false" />
  </main>
</template>
