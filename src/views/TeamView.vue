<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { TherapistDTO } from '@/shared';
import PageHead from '@/components/PageHead.vue';
import TherapistFormDialog from '@/components/TherapistFormDialog.vue';
import { errorText } from '@/lib/api';
import { initials } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useAuth } from '@/stores/auth';
import { useDirectory } from '@/stores/directory';

const auth = useAuth(), dir = useDirectory();
const q = ref(''), svc = ref('all'), kind = ref('all'), act = ref('act');
const form = ref<{ therapist: TherapistDTO | null } | null>(null);
const loaded = ref(false);

/** Los filtros viajan al servidor; la búsqueda espera un instante para no consultar en cada tecla. */
async function load() {
  try {
    await dir.loadTherapists({
      q: q.value.trim(), service: svc.value === 'all' ? '' : svc.value, kind: kind.value === 'all' ? '' : kind.value,
      active: act.value === 'all' ? '' : act.value === 'act' ? 'true' : 'false'
    });
  } catch (e) { toast(errorText(e)); }
  loaded.value = true;
}
let timer: ReturnType<typeof setTimeout>;
watch(q, () => { clearTimeout(timer); timer = setTimeout(load, 250); });
watch([svc, kind, act], load);
onMounted(async () => { await Promise.all([dir.loadServices().catch(() => {}), load()]); });
onBeforeUnmount(() => clearTimeout(timer));

const rows = computed(() => dir.therapists);
function saved() { form.value = null; load(); }
</script>

<template>
  <main>
    <PageHead title="Equipo" subtitle="Directorio de terapeutas. Desde aquí se asignan a los servicios y se definen como planta o apoyo.">
      <button v-if="auth.isAdmin" class="btn primary" @click="form = { therapist: null }">＋ Registrar terapeuta</button>
    </PageHead>
    <div class="banner" v-if="!auth.isAdmin">Solo un administrador puede registrar o editar terapeutas. Puedes consultar el directorio y agregarlas a tus cuadros.</div>
    <div class="filters">
      <input v-model="q" placeholder="Buscar por nombre o documento" aria-label="Buscar" style="min-width:240px">
      <select v-model="svc" aria-label="Servicio"><option value="all">Todos los servicios</option><option v-for="s in dir.services" :key="s.id" :value="s.id">{{ s.name }}</option></select>
      <select v-model="kind" aria-label="Tipo"><option value="all">Planta y apoyo</option><option value="fija">Solo planta</option><option value="apoyo">Solo apoyo</option></select>
      <select v-model="act" aria-label="Estado"><option value="act">Activas</option><option value="ina">Inactivas</option><option value="all">Todas</option></select>
    </div>
    <div class="tw2">
      <table class="tbl">
        <thead><tr><th>Terapeuta</th><th>Documento</th><th>Cargo</th><th>Tipo</th><th>Servicios</th><th>Cuadros</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id" tabindex="0" @click="form = { therapist: p }" @keydown.enter="form = { therapist: p }">
            <td><div class="who2"><span class="av">{{ initials(p.name) }}</span>{{ p.name }}</div></td>
            <td>{{ p.document }}</td>
            <td>{{ p.position }}</td>
            <td><span class="pl" :class="{ apoyo: p.defaultKind === 'apoyo' }">{{ p.defaultKind === 'fija' ? 'Planta' : 'Apoyo' }}</span></td>
            <td><div class="pills">
              <template v-for="id in p.serviceIds" :key="id"><span class="pl" v-if="dir.service(id)"><span class="svdot" :style="{ background: dir.service(id)!.color, marginRight: '4px', width: '7px', height: '7px' }"></span>{{ dir.service(id)!.name }}</span></template>
              <span class="empty" v-if="!p.serviceIds.length">Sin servicio</span>
            </div></td>
            <td>{{ p.scheduleCount }}</td>
            <td><span class="st-pill" :class="p.active ? 'pub' : 'bor'">{{ p.active ? 'Activa' : 'Inactiva' }}</span></td>
          </tr>
          <tr v-if="loaded && !rows.length"><td colspan="7" class="empty">No hay terapeutas con esos filtros.</td></tr>
        </tbody>
      </table>
    </div>
    <TherapistFormDialog v-if="form" :therapist="form.therapist" :readonly="!auth.isAdmin" @close="form = null" @saved="saved" />
  </main>
</template>

<style scoped>
/* Valores del mockup (chip "Apoyo" del directorio), que allí iban en línea */
.pl.apoyo { background: #FFE9B5; color: #7A5200; }
</style>
