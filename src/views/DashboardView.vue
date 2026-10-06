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
import { periodOptions } from '@/lib/dashboard';
import { toast } from '@/lib/toast';
import { useAuth } from '@/stores/auth';
import { useDashboard } from '@/stores/dashboard';
import { useDirectory } from '@/stores/directory';
import { useSchedules } from '@/stores/schedules';

const auth = useAuth(), dir = useDirectory(), dash = useDashboard(), schedules = useSchedules();
const { t } = useI18n();
const svc = ref('all'), per = ref('');
const detail = ref<DashboardTherapistDetail | null>(null);

const services = computed(() => (auth.isAdmin ? dir.services : dir.services.filter(s => auth.user?.serviceIds.includes(s.id))));
const periods = computed(() => periodOptions(schedules.list));
/** Sin ningún cuadro no hay períodos que elegir: se consulta el mes actual y la pantalla muestra ceros. */
const query = () => {
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
watch([svc, per], refresh);
</script>

<template>
  <main>
    <PageHead :title="t('dashboardView.title')" :subtitle="t('dashboardView.sub')">
      <div class="filters" style="margin:0">
        <select v-model="svc" :aria-label="t('dashboardView.service')"><option value="all">{{ t('dashboardView.allServices') }}</option><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select>
        <select v-model="per" :aria-label="t('dashboardView.period')"><option v-for="p in periods" :key="p.value" :value="p.value">{{ p.label }}</option></select>
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
