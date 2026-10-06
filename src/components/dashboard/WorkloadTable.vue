<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DashboardTherapistRow } from '@/shared';
import { initials } from '@/lib/format';
import { useDirectory } from '@/stores/directory';

const props = defineProps<{ rows: DashboardTherapistRow[] }>();
const emit = defineEmits<{ open: [id: string] }>();
const dir = useDirectory();

type Key = 'name' | 'h' | 'sh' | 'N' | 'we' | 'cada' | 'rest' | 'abs';
const sort = ref<{ k: Key; dir: 1 | -1 }>({ k: 'h', dir: -1 });
const cols: [Key | '', string][] = [['name', 'Terapeuta'], ['h', 'Horas'], ['sh', 'Turnos M · T · N'], ['N', 'Noches'], ['we', 'Fines de semana'], ['cada', 'Trabaja cada'], ['rest', 'Descanso medio'], ['abs', 'Ausencias'], ['', 'Patrón']];
const val = (r: DashboardTherapistRow, k: Key): string | number =>
  ({ name: r.name, h: r.hours, sh: r.M + r.T + r.N, N: r.N, we: r.weekendDays, cada: r.everyDays, rest: r.restAvg, abs: r.absDays })[k];
const sorted = computed(() => props.rows.slice().sort((x, y) => {
  const a = val(x, sort.value.k), b = val(y, sort.value.k);
  return (typeof a === 'string' ? a.localeCompare(b as string) : a - (b as number)) * sort.value.dir;
}));
const maxHours = computed(() => Math.max(1, ...props.rows.map(r => r.hours)));
function sortBy(k: Key) { sort.value = { k, dir: sort.value.k === k ? (-sort.value.dir as 1 | -1) : k === 'name' ? 1 : -1 }; }
const svc = (id: string) => dir.service(id) ?? { name: 'Servicio eliminado', color: '#999999' };
const total = (r: DashboardTherapistRow) => r.M + r.T + r.N || 1;
</script>
<template>
  <div class="tw2">
    <table class="tbl">
      <thead><tr>
        <th v-for="[k, label] in cols" :key="label" :data-sort="k || undefined" @click="k && sortBy(k)">{{ label }}{{ sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : '' }}</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in sorted" :key="r.id" tabindex="0" @click="emit('open', r.id)" @keydown.enter="emit('open', r.id)">
          <td><div class="who2"><span class="av">{{ initials(r.name) }}</span><div>{{ r.name }}
            <div class="pills">
              <span class="pl" v-for="id in r.serviceIds" :key="id"><span class="svdot" :style="{ background: svc(id).color, marginRight: '4px', width: '7px', height: '7px' }"></span>{{ svc(id).name }}</span>
              <span class="pl apoyo" v-if="r.kinds.includes('apoyo') && !r.kinds.includes('fija')">Apoyo</span>
            </div></div></div></td>
          <td><div class="hbar"><b>{{ r.hours }} h</b><i :style="{ width: r.hours / maxHours * 90 + 'px' }"></i></div></td>
          <td>
            <div class="mbar" :title="`${r.M} mañanas · ${r.T} tardes · ${r.N} noches`"><i :style="{ width: r.M / total(r) * 100 + '%', background: 'var(--m)' }"></i><i :style="{ width: r.T / total(r) * 100 + '%', background: 'var(--t)' }"></i><i :style="{ width: r.N / total(r) * 100 + '%', background: 'var(--n)' }"></i></div>
            <small style="color:var(--muted)">{{ r.M }} · {{ r.T }} · {{ r.N }}</small>
          </td>
          <td>{{ r.N }}</td>
          <td>{{ r.weekendDays }}</td>
          <td>{{ r.workDays ? 'cada ' + r.everyDays.toFixed(1) + ' días' : '—' }}</td>
          <td>{{ r.workDays ? r.restAvg.toFixed(1) + ' días' : '—' }}</td>
          <td>{{ r.absDays ? r.absDays + ' d' : '—' }}</td>
          <td style="min-width:150px"><div class="strip"><u v-for="(x, i) in r.pattern" :key="i" :class="'s-' + x"></u></div></td>
        </tr>
        <tr v-if="!rows.length"><td colspan="9" class="empty">No hay cuadros en este período.</td></tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Valores del mockup (chip «Apoyo» de las tablas), que allí iban en línea */
.pl.apoyo { background: #FFE9B5; color: #7A5200; }
</style>
