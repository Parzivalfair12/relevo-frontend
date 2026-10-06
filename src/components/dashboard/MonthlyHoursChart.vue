<script setup lang="ts">
import { computed } from 'vue';
import { MESES, type DashboardDTO } from '@/shared';
import ShiftChip from '@/components/ShiftChip.vue';

const props = defineProps<{ months: DashboardDTO['hoursByMonth'] }>();
const max = computed(() => Math.max(1, ...props.months.map(m => m.total)));
const pct = (v: number, total: number) => v / Math.max(total, 1) * 100 + '%';
</script>
<template>
  <div class="panel"><h3>Horas por mes</h3>
    <div class="cbars">
      <div class="cb" v-for="m in months" :key="m.year * 12 + m.month">
        <b>{{ m.total.toLocaleString('es-CO') }} h</b>
        <div class="stk" :style="{ height: m.total / max * 120 + 'px' }">
          <i :style="{ height: pct(m.M, m.total), background: 'var(--m)' }"></i><i :style="{ height: pct(m.T, m.total), background: 'var(--t)' }"></i><i :style="{ height: pct(m.N, m.total), background: 'var(--n)' }"></i>
        </div>
        <span>{{ MESES[m.month] }}</span>
      </div>
    </div>
    <div class="legend" style="margin:10px 0 0"><span><ShiftChip code="M" />Mañana</span><span><ShiftChip code="T" />Tarde</span><span><ShiftChip code="N" />Noche</span></div>
  </div>
</template>
