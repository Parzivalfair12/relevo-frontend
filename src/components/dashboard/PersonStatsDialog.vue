<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { SHIFT_NAME, type DashboardTherapistDetail, type ShiftCode } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import ShiftChip from '@/components/ShiftChip.vue';
import { useDirectory } from '@/stores/directory';
import { monthName, shiftName } from '@/i18n';

const props = defineProps<{ detail: DashboardTherapistDetail }>();
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const dir = useDirectory();
const d = props.detail;
const services = d.serviceIds.map(id => dir.service(id)?.name ?? t('dashboard.service.deleted')).join(t('dashboard.person.and'));
const dayTitle = (x: string, i: number) => t('dashboard.person.dayTitle', { n: i + 1, name: SHIFT_NAME[x as ShiftCode] ? shiftName(x) : t('dashboard.person.unassigned') });
</script>
<template>
  <ModalDialog :title="d.name" :sub="t('dashboard.person.sub', { kind: d.kinds.includes('fija') ? t('dashboard.person.permanent') : t('dashboard.person.support'), services })" @close="emit('close')">
    <div class="pst">
      <div><b>{{ d.hours }} h</b><span>{{ t('dashboard.person.hours') }}</span></div>
      <div><b>{{ d.workDays ? d.everyDays.toFixed(1) : '—' }}</b><span>{{ t('dashboard.person.everyDays') }}</span></div>
      <div><b>{{ d.workDays ? d.restAvg.toFixed(1) : '—' }}</b><span>{{ t('dashboard.person.restAvg') }}</span></div>
      <div><b>{{ d.maxRun }}</b><span>{{ t('dashboard.person.maxRun') }}</span></div>
      <div><b>{{ d.N }}</b><span>{{ t('dashboard.person.nights') }}</span></div>
      <div><b>{{ d.weekendDays }}</b><span>{{ t('dashboard.person.weekend') }}</span></div>
    </div>
    <template v-for="m in d.months" :key="m.year * 12 + m.month">
      <div class="grp-h"><span>{{ monthName(m.month) }} · {{ m.hours }} h</span></div>
      <div class="strip big"><u v-for="(x, i) in m.days" :key="i" :class="'s-' + x" :title="dayTitle(x, i)"></u></div>
    </template>
    <div class="legend" style="margin:12px 0 0">
      <span><ShiftChip code="M" />{{ shiftName('M') }}</span><span><ShiftChip code="T" />{{ shiftName('T') }}</span><span><ShiftChip code="N" />{{ shiftName('N') }}</span>
      <span><ShiftChip code="L" label="·" />{{ t('dashboard.person.rest') }}</span><span><ShiftChip code="V" />{{ t('dashboard.person.absence') }}</span>
    </div>
    <div class="mact"><button class="btn primary" @click="emit('close')">{{ t('common.close') }}</button></div>
  </ModalDialog>
</template>
