<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Kind } from '@/shared';
import { monthName, shiftName } from '@/i18n';
import ModalDialog from '@/components/ModalDialog.vue';
import ShiftChip from '@/components/ShiftChip.vue';
import { absDays, absRanges, firstName, hoursOfRow, nightsOf, weekendWorkOf } from '@/lib/schedule';
import { toast } from '@/lib/toast';
import { useEditor } from '@/stores/editor';

const props = defineProps<{ therapistId: string }>();
const emit = defineEmits<{ close: []; absence: [id: string] }>();
const { t } = useI18n();
const ed = useEditor();
const m = computed(() => ed.s!.members.find(x => x.therapistId === props.therapistId));
const n = ed.n;
const st = computed(() => {
  const mm = m.value!, g = mm.days, libres = g.filter(x => x === 'L').length, ad = absDays(mm, n);
  return { h: hoursOfRow(g), tg: ed.tg[mm.therapistId], nights: nightsOf(g), we: weekendWorkOf(g, ed.s!.year, ed.s!.month), libres, ad, worked: n - libres - ad };
});
const ranges = computed(() => absRanges(m.value!, n));
const target = ref(m.value?.targetHours != null ? String(m.value.targetHours) : '');
const targetValid = computed(() => target.value.trim() === '' || (Number.isFinite(Number(target.value)) && Number(target.value) >= 0 && Number(target.value) <= 744));
async function saveTarget() {
  const name = firstName(m.value!.name), v = target.value.trim() === '' ? null : Number(target.value);
  emit('close');
  if (await ed.setTarget(props.therapistId, v)) toast(v === null ? t('editor.person.targetAuto', { name }) : t('editor.person.targetSet', { name, n: v }));
}

async function setKind(k: Kind) {
  const name = firstName(m.value!.name);
  emit('close');
  if (await ed.setKind(props.therapistId, k)) toast(t('editor.person.nowKind', { name, kind: k === 'fija' ? t('editor.team.kindStaff') : t('editor.team.kindSupport') }));
}
async function removeAbsence(i: number) {
  const r = ranges.value[i];
  emit('close'); // como en el mockup, el diálogo se cierra al quitar una ausencia
  if (await ed.removeAbsence({ therapistId: props.therapistId, from: r.from, to: r.to })) toast(t('editor.person.absenceRemoved'));
}
async function removeMember() {
  if (ed.s!.members.length <= 2) return toast(t('editor.person.minTwo'));
  const name = firstName(m.value!.name);
  emit('close');
  if (await ed.removeMember(props.therapistId)) toast(t('editor.person.left', { name }));
}
</script>
<template>
  <ModalDialog v-if="m" :title="m.name" :sub="`${m.kind === 'fija' ? t('editor.person.subStaff') : t('editor.person.subSupport')} · ${monthName(ed.s!.month)} ${ed.s!.year}`" @close="emit('close')">
    <div class="seg"><button v-for="[k, l] in ([['fija', t('editor.team.staffKind')], ['apoyo', t('editor.team.support')]] as [Kind, string][])" :key="k" :aria-pressed="m.kind === k" @click="setKind(k)">{{ l }}</button></div>
    <div class="pst">
      <div><b>{{ st.h }} h</b><span>{{ st.tg != null ? t('editor.person.target', { n: st.tg.toFixed(0) }) : t('editor.person.monthHours') }}</span></div>
      <div><b>{{ st.nights }}</b><span>{{ t('editor.person.nights') }}</span></div>
      <div><b>{{ st.we }}</b><span>{{ t('editor.person.weekendShifts') }}</span></div>
      <div><b>{{ st.libres }}</b><span>{{ t('editor.person.freeDays') }}</span></div>
      <div><b>{{ st.ad }}</b><span>{{ t('editor.person.absenceDays') }}</span></div>
      <div><b>{{ st.worked }}</b><span>{{ t('editor.person.workedDays') }}</span></div>
    </div>
    <div class="fld" style="margin-top:10px"><label for="pd-target">{{ t('editor.person.targetLabel') }}</label>
      <div style="display:flex;gap:6px"><input id="pd-target" type="number" min="0" max="744" step="1" :placeholder="t('editor.person.targetPlaceholder')" v-model="target" style="flex:1" @keydown.enter.prevent="targetValid && saveTarget()"><button class="btn" :disabled="!targetValid" @click="saveTarget">{{ t('editor.person.saveTarget') }}</button></div>
      <p class="note" style="margin:4px 0 0">{{ targetValid ? t('editor.person.targetHelp') : t('editor.person.targetInvalid') }}</p></div>
    <div class="grp-h"><span>{{ t('editor.person.absences') }}</span></div>
    <div class="alist">
      <div class="ai" v-for="(r, i) in ranges" :key="i"><ShiftChip :code="r.code" /><span>{{ shiftName(r.code) }} · {{ r.from === r.to ? t('editor.person.day', { n: r.from }) : t('editor.person.days', { from: r.from, to: r.to }) }}</span><button class="x" :aria-label="t('editor.person.removeAbsenceAria')" @click="removeAbsence(i)">✕</button></div>
      <div class="empty" v-if="!ranges.length">{{ t('editor.person.noAbsences') }}</div>
    </div>
    <div class="mact"><button class="btn danger" @click="removeMember">{{ t('editor.person.removeFromTeam') }}</button><button class="btn" @click="emit('absence', therapistId)">{{ t('editor.person.addAbsence') }}</button><button class="btn primary" @click="emit('close')">{{ t('editor.person.done') }}</button></div>
  </ModalDialog>
</template>
