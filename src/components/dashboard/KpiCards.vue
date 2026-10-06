<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardDTO } from '@/shared';

const props = defineProps<{ data: DashboardDTO }>();
const k = computed(() => props.data.kpis);
const fmt = (n: number) => n.toLocaleString('es-CO');
</script>
<template>
  <div class="kp">
    <div class="stat"><span>Horas trabajadas</span><b>{{ fmt(k.hours) }}</b><small>{{ data.scheduleCount }} cuadro(s) en el período</small></div>
    <div class="stat"><span>Terapeutas con turnos</span><b>{{ k.activeTherapists }}</b><small>{{ k.idleTherapists }} sin turnos en el período</small></div>
    <div class="stat" :class="k.coveragePct === 100 ? 'good' : 'bad'"><span>Días cubiertos</span><b>{{ k.coveragePct }}%</b><small>{{ k.gapDays ? k.gapDays + ' día(s) con turnos sin cubrir' : 'Todos los turnos con terapeuta' }}</small></div>
    <div class="stat"><span>Horas de apoyo</span><b>{{ k.supportHours }}</b><small>{{ k.supportPct }}% del total</small></div>
    <div class="stat"><span>Días de ausencia</span><b>{{ k.absenceDays }}</b><small>Vacaciones, incapacidad y permisos</small></div>
  </div>
</template>
