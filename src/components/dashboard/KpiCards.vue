<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DashboardDTO } from '@/shared';
import { formatNumber } from '@/i18n';

const props = defineProps<{ data: DashboardDTO }>();
const k = computed(() => props.data.kpis);
const { t } = useI18n();
const fmt = (n: number) => formatNumber(n);
</script>
<template>
  <div class="kp">
    <div class="stat"><span>{{ t('dashboard.kpi.hours') }}</span><b>{{ fmt(k.hours) }}</b><small>{{ t('dashboard.kpi.schedules', { n: data.scheduleCount }) }}</small></div>
    <div class="stat"><span>{{ t('dashboard.kpi.activeTherapists') }}</span><b>{{ k.activeTherapists }}</b><small>{{ t('dashboard.kpi.idle', { n: k.idleTherapists }) }}</small></div>
    <div class="stat" :class="k.coveragePct === 100 ? 'good' : 'bad'"><span>{{ t('dashboard.kpi.coverage') }}</span><b>{{ k.coveragePct }}%</b><small>{{ k.gapDays ? t('dashboard.kpi.gapDays', { n: k.gapDays }) : t('dashboard.kpi.fullCoverage') }}</small></div>
    <div class="stat"><span>{{ t('dashboard.kpi.supportHours') }}</span><b>{{ k.supportHours }}</b><small>{{ t('dashboard.kpi.ofTotal', { pct: k.supportPct }) }}</small></div>
    <div class="stat"><span>{{ t('dashboard.kpi.absenceDays') }}</span><b>{{ k.absenceDays }}</b><small>{{ t('dashboard.kpi.absenceHint') }}</small></div>
  </div>
</template>
