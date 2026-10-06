<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { monthName } from '@/i18n';
import { type ScheduleDTO, type ServiceDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { errorText, post } from '@/lib/api';
import { monthOptions } from '@/lib/schedule';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';
import { useSchedules } from '@/stores/schedules';

const props = defineProps<{ services: ServiceDTO[] }>();
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const router = useRouter(), dir = useDirectory(), list = useSchedules();

const options = monthOptions();
const cur = options.find(o => o.current)!;
const svc = ref(props.services[0].id), month = ref(`${cur.year}-${cur.month}`), busy = ref(false);
const ym = computed(() => month.value.split('-').map(Number) as [number, number]);
const dup = computed(() => list.list.some(c => c.serviceId === svc.value && c.year === ym.value[0] && c.month === ym.value[1]));
const prevMonth = computed<[number, number]>(() => (ym.value[1] === 0 ? [ym.value[0] - 1, 11] : [ym.value[0], ym.value[1] - 1]));
const hasPrev = computed(() => list.list.some(c => c.serviceId === svc.value && c.year === prevMonth.value[0] && c.month === prevMonth.value[1]));
const note = computed(() => dup.value
  ? t('dialogs.newSchedule.dup')
  : hasPrev.value
    ? t('dialogs.newSchedule.copyPrev', { month: monthName(prevMonth.value[1]).toLowerCase() })
    : t('dialogs.newSchedule.useActive', { n: dir.therapists.filter(x => x.active && x.serviceIds.includes(svc.value)).length }));

async function create() {
  busy.value = true;
  try {
    const s = await post<ScheduleDTO>('/schedules', { serviceId: svc.value, year: ym.value[0], month: ym.value[1] });
    emit('close');
    await router.push({ name: 'editor', params: { id: s.id } });
    toast(hasPrev.value ? t('dialogs.newSchedule.createdContinues', { month: monthName(prevMonth.value[1]).toLowerCase() }) : t('dialogs.newSchedule.created'));
  } catch (e) { toast(errorText(e)); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog :title="t('dialogs.newSchedule.title')" :sub="t('dialogs.newSchedule.sub')" @close="emit('close')">
    <form novalidate @submit.prevent="create">
      <div class="fld"><label for="n-s">{{ t('dialogs.newSchedule.service') }}</label><select id="n-s" v-model="svc"><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
      <div class="fld"><label for="n-m">{{ t('dialogs.newSchedule.month') }}</label>
        <select id="n-m" v-model="month"><option v-for="o in options" :key="`${o.year}-${o.month}`" :value="`${o.year}-${o.month}`">{{ monthName(o.month) }} {{ o.year }}</option></select></div>
      <p class="note" style="margin:0 0 8px">{{ note }}</p>
      <div class="mact"><button type="button" class="btn" @click="emit('close')">{{ t('common.cancel') }}</button><button type="submit" class="btn primary" :disabled="dup || busy">{{ t('dialogs.newSchedule.create') }}</button></div>
    </form>
  </ModalDialog>
</template>
