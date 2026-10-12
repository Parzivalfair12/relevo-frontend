<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DashboardTherapistDetail } from '@/shared';
import InsightsList from '@/components/dashboard/InsightsList.vue';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import MonthlyHoursChart from '@/components/dashboard/MonthlyHoursChart.vue';
import PersonStatsDialog from '@/components/dashboard/PersonStatsDialog.vue';
import ServiceHoursBars from '@/components/dashboard/ServiceHoursBars.vue';
import WorkloadTable from '@/components/dashboard/WorkloadTable.vue';
import PageHead from '@/components/PageHead.vue';
import { errorText } from '@/lib/api';
import { customPeriod, monthKeys, monthLabel, periodOptions } from '@/lib/dashboard';
import { toast } from '@/lib/toast';
import { useAuth } from '@/stores/auth';
import { useDashboard } from '@/stores/dashboard';
import { useDirectory } from '@/stores/directory';
import { useSchedules } from '@/stores/schedules';

const auth = useAuth(), dir = useDirectory(), dash = useDashboard(), schedules = useSchedules();
const { t } = useI18n();
const svc = ref('all'), per = ref('');
/** Rango elegido a mano («Otro rango…»): primer y último mes como número año×12+mes */
const cFrom = ref(0), cTo = ref(0);
const CUSTOM = 'custom';
const detail = ref<DashboardTherapistDetail | null>(null);

const services = computed(() => (auth.isAdmin ? dir.services : dir.services.filter(s => auth.user?.serviceIds.includes(s.id))));
const periods = computed(() => periodOptions(schedules.list));
const months = computed(() => monthKeys(schedules.list));
const custom = computed(() => per.value === CUSTOM);
/** Cada extremo arrastra al otro para que «Desde» nunca quede después de «Hasta» */
const setFrom = (e: Event) => { cFrom.value = Number((e.target as HTMLSelectElement).value); if (cFrom.value > cTo.value) cTo.value = cFrom.value; };
const setTo = (e: Event) => { cTo.value = Number((e.target as HTMLSelectElement).value); if (cTo.value < cFrom.value) cFrom.value = cTo.value; };
/** Sin ningún cuadro no hay períodos que elegir: se consulta el mes actual y la pantalla muestra ceros. */
const query = () => {
  if (custom.value && months.value.length) return { service: svc.value, ...customPeriod(cFrom.value, cTo.value) };
  const p = periods.value.find(o => o.value === per.value);
  if (p) return { service: svc.value, from: p.from, to: p.to };
  if (periods.value.length) return null;
  const d = new Date(), cur = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { service: svc.value, from: cur, to: cur };
};

async function refresh() {
  const q = query(); if (!q) return;
  try { await dash.load(q); } catch (e) { toast(errorText(e)); }
}
async function open(id: string) {
  const q = query(); if (!q) return;
  try { detail.value = await dash.detail(id, q); } catch (e) { toast(errorText(e)); }
}
onMounted(async () => {
  try { await Promise.all([dir.loadServices(), schedules.load()]); } catch (e) { toast(errorText(e)); }
  per.value = periods.value[0]?.value ?? '';
  await refresh();
});
// Al pasar a «Otro rango…» se parte del período completo (primer a último mes con cuadros)
watch(per, p => { if (p === CUSTOM && months.value.length) { cFrom.value ||= months.value[0]; cTo.value ||= months.value[months.value.length - 1]; } });
watch([svc, per, cFrom, cTo], refresh);
</script>

<template>
  <main>
    <PageHead :title="t('dashboardView.title')" :subtitle="t('dashboardView.sub')">
      <div class="filters" style="margin:0">
        <select v-model="svc" :aria-label="t('dashboardView.service')"><option value="all">{{ t('dashboardView.allServices') }}</option><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select>
        <select v-model="per" :aria-label="t('dashboardView.period')"><option v-for="p in periods" :key="p.value" :value="p.value">{{ p.label }}</option><option v-if="months.length > 1" :value="CUSTOM">{{ t('dashboardView.customRange') }}</option></select>
        <template v-if="custom">
          <label class="rg">{{ t('dashboardView.from') }} <select :value="cFrom" :aria-label="t('dashboardView.from')" @change="setFrom"><option v-for="k in months" :key="k" :value="k">{{ monthLabel(k) }}</option></select></label>
          <label class="rg">{{ t('dashboardView.to') }} <select :value="cTo" :aria-label="t('dashboardView.to')" @change="setTo"><option v-for="k in months" :key="k" :value="k">{{ monthLabel(k) }}</option></select></label>
        </template>
      </div>
    </PageHead>
    <template v-if="dash.data">
      <KpiCards :data="dash.data" />
      <InsightsList :items="dash.data.insights" />
      <div class="panel" style="margin-bottom:16px"><h3>{{ t('dashboardView.workload') }}</h3>
        <p class="note" style="margin:-4px 0 10px">{{ t('dashboardView.hint') }}</p>
        <WorkloadTable :rows="dash.data.therapists" @open="open" />
      </div>
      <div class="two"><MonthlyHoursChart :months="dash.data.hoursByMonth" /><ServiceHoursBars :items="dash.data.hoursByService" /></div>
    </template>
    <PersonStatsDialog v-if="detail" :detail="detail" @close="detail = null" />
  </main>
</template>

<style scoped>
.rg { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 13px; }
</style>
