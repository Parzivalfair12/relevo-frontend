<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Kind, ScheduleMemberDTO } from '@/shared';
import { absDays, hoursOfRow } from '@/lib/schedule';
import { initials } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';
import { useEditor } from '@/stores/editor';

const emit = defineEmits<{ person: [id: string]; absence: [id?: string] }>();
const ed = useEditor(), dir = useDirectory(), router = useRouter();
const person = ref(''), kind = ref<Kind>('apoyo');

/** Terapeutas activas que aún no están en el cuadro; primero las del servicio. */
const candidates = computed(() => {
  const inTeam = new Set(ed.s!.members.map(m => m.therapistId)), sv = ed.s!.serviceId;
  return dir.therapists.filter(t => t.active && !inTeam.has(t.id))
    .sort((a, b) => Number(b.serviceIds.includes(sv)) - Number(a.serviceIds.includes(sv)) || a.name.localeCompare(b.name));
});
watch(candidates, c => { if (!c.some(t => t.id === person.value)) person.value = c[0]?.id ?? ''; }, { immediate: true });
/** Al elegir a alguien, el grupo se propone según su tipo por defecto. */
function pick() { const t = dir.therapists.find(x => x.id === person.value); if (t) kind.value = t.defaultKind; }

async function add() {
  const t = dir.therapists.find(x => x.id === person.value);
  if (!t) return toast('No hay más terapeutas por agregar. Registra nuevas en Equipo.');
  const k = kind.value;
  ed.step = Math.max(ed.step, 1);
  if (await ed.addMember(t.id, k)) toast(`${t.name} se agregó como ${k === 'fija' ? 'planta' : 'apoyo'}`);
}
const mini = (m: ScheduleMemberDTO) => { const ad = absDays(m, ed.n); return `${hoursOfRow(m.days)} h${ad ? ' · ' + ad + ' d ausente' : ''}`; };
const groups = computed(() => [
  { t: 'Planta (fijas)', l: ed.fijas, empty: 'Sin terapeutas de planta' },
  { t: 'Apoyo y reemplazos', l: ed.apoyo, empty: 'Agrega terapeutas de apoyo abajo' }
]);
</script>
<template>
  <div class="panel team" id="teamPanel">
    <h3>Equipo del cuadro <span style="color:var(--muted);font-weight:500">({{ ed.fijas.length }} de planta · {{ ed.apoyo.length }} de apoyo)</span></h3>
    <p class="note" style="margin:0 0 4px">Toca un nombre para ver su detalle o registrar una ausencia.</p>
    <template v-for="g in groups" :key="g.t">
      <div class="grp-h"><span>{{ g.t }}</span></div>
      <ul>
        <li v-for="m in g.l" :key="m.therapistId" @click="emit('person', m.therapistId)">
          <span class="av">{{ initials(m.name) }}</span>
          <span class="nm" :title="m.name">{{ m.name }}<br><span class="mini">{{ mini(m) }}</span></span>
          <button class="mv" title="Registrar ausencia" @click.stop="emit('absence', m.therapistId)">＋ Ausencia</button>
        </li>
        <li class="empty" v-if="!g.l.length">{{ g.empty }}</li>
      </ul>
    </template>
    <form class="add" @submit.prevent="add">
      <select v-model="person" aria-label="Terapeuta del directorio" style="flex:1;min-width:0;max-width:none" @change="pick">
        <option v-for="t in candidates" :key="t.id" :value="t.id">{{ t.name }}{{ t.serviceIds.includes(ed.s!.serviceId) ? '' : ' (otro servicio)' }}</option>
        <option v-if="!candidates.length" value="">Todas ya están en el cuadro</option>
      </select>
      <select v-model="kind" aria-label="Grupo"><option value="apoyo">Apoyo</option><option value="fija">Planta</option></select>
      <button class="btn sm primary" type="submit">Agregar</button>
    </form>
    <p class="note" style="margin:6px 0 0">¿No está en la lista? <button class="link" type="button" @click="router.push({ name: 'team' })">Regístrala en Equipo</button>.</p>
    <button class="btn" style="width:100%;margin-top:12px;justify-content:center" @click="emit('absence')">＋ Registrar ausencia</button>
  </div>
</template>
