<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DashboardDTO } from '@/shared';
import { useDirectory } from '@/stores/directory';

const props = defineProps<{ items: DashboardDTO['hoursByService'] }>();
const { t } = useI18n();
const dir = useDirectory();
const max = computed(() => Math.max(1, ...props.items.map(x => x.hours)));
const svc = (id: string) => dir.service(id) ?? { name: t('dashboard.service.deleted'), color: '#999999' };
</script>
<template>
  <div class="panel"><h3>{{ t('dashboard.service.title') }}</h3>
    <div class="hlist">
      <div class="hl2" v-for="x in items" :key="x.serviceId">
        <span><span class="svdot" :style="{ background: svc(x.serviceId).color }"></span>{{ svc(x.serviceId).name }}</span>
        <div class="bar"><u :style="{ width: x.hours / max * 100 + '%', background: svc(x.serviceId).color }"></u></div>
        <b>{{ x.hours }} h</b>
      </div>
      <div class="empty" v-if="!items.length">{{ t('dashboard.service.none') }}</div>
    </div>
  </div>
</template>
