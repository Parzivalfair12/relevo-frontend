<script setup lang="ts">
import { MESES, SHIFT_NAME, type DashboardTherapistDetail, type ShiftCode } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import ShiftChip from '@/components/ShiftChip.vue';
import { useDirectory } from '@/stores/directory';

const props = defineProps<{ detail: DashboardTherapistDetail }>();
const emit = defineEmits<{ close: [] }>();
const dir = useDirectory();
const d = props.detail;
const services = d.serviceIds.map(id => dir.service(id)?.name ?? 'Servicio eliminado').join(' y ');
const dayTitle = (x: string, i: number) => `Día ${i + 1}: ${SHIFT_NAME[x as ShiftCode] || 'No asignada'}`;
</script>
<template>
  <ModalDialog :title="d.name" :sub="`${d.kinds.includes('fija') ? 'Planta' : 'Apoyo'} en ${services}`" @close="emit('close')">
    <div class="pst">
      <div><b>{{ d.hours }} h</b><span>Horas</span></div>
      <div><b>{{ d.workDays ? d.everyDays.toFixed(1) : '—' }}</b><span>Trabaja cada (días)</span></div>
      <div><b>{{ d.workDays ? d.restAvg.toFixed(1) : '—' }}</b><span>Descanso medio (días)</span></div>
      <div><b>{{ d.maxRun }}</b><span>Racha máxima de días</span></div>
      <div><b>{{ d.N }}</b><span>Noches</span></div>
      <div><b>{{ d.weekendDays }}</b><span>Turnos fin de semana</span></div>
    </div>
    <template v-for="m in d.months" :key="m.year * 12 + m.month">
      <div class="grp-h"><span>{{ MESES[m.month] }} · {{ m.hours }} h</span></div>
      <div class="strip big"><u v-for="(x, i) in m.days" :key="i" :class="'s-' + x" :title="dayTitle(x, i)"></u></div>
    </template>
    <div class="legend" style="margin:12px 0 0">
      <span><ShiftChip code="M" />Mañana</span><span><ShiftChip code="T" />Tarde</span><span><ShiftChip code="N" />Noche</span>
      <span><ShiftChip code="L" label="·" />Descanso</span><span><ShiftChip code="V" />Ausencia</span>
    </div>
    <div class="mact"><button class="btn primary" @click="emit('close')">Cerrar</button></div>
  </ModalDialog>
</template>
