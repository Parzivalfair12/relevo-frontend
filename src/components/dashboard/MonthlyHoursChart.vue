<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DashboardDTO } from '@/shared';
import { monthName, formatNumber, shiftName } from '@/i18n';
import ShiftChip from '@/components/ShiftChip.vue';

const { t } = useI18n();
const props = defineProps<{ months: DashboardDTO['hoursByMonth'] }>();
const max = computed(() => Math.max(1, ...props.months.map(m => m.total)));
const pct = (v: number, total: number) => v / Math.max(total, 1) * 100 + '%';
</script>
<template>
  <div class="panel"><h3>{{ t('dashboard.monthly.title') }}</h3>
    <div class="cbars">
      <div class="cb" v-for="m in months" :key="m.year * 12 + m.month">
        <b>{{ formatNumber(m.total) }} h</b>
        <div class="stk" :style="{ height: m.total / max * 120 + 'px' }">
          <i :style="{ height: pct(m.M, m.total), background: 'var(--m)' }"></i><i :style="{ height: pct(m.T, m.total), background: 'var(--t)' }"></i><i :style="{ height: pct(m.N, m.total), background: 'var(--n)' }"></i>
        </div>
        <span>{{ monthName(m.month) }}</span>
      </div>
    </div>
    <div class="legend" style="margin:10px 0 0"><span><ShiftChip code="M" />{{ shiftName('M') }}</span><span><ShiftChip code="T" />{{ shiftName('T') }}</span><span><ShiftChip code="N" />{{ shiftName('N') }}</span></div>
  </div>
</template>
