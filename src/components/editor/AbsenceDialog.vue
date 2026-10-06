<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { monthName, shiftName } from '@/i18n';
import ModalDialog from '@/components/ModalDialog.vue';
import ShiftChip from '@/components/ShiftChip.vue';
import { firstName, hoursOfRow } from '@/lib/schedule';
import { toast } from '@/lib/toast';
import { useEditor } from '@/stores/editor';

type Code = 'V' | 'I' | 'P';
const props = defineProps<{ therapistId?: string }>();
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const ed = useEditor();
const s =ed.s!, n = ed.n;
/** El tipo de ausencia elegido se recuerda de una vez a otra, como en el mockup. */
let lastCode: Code = 'P';

const who = ref(props.therapistId ?? (ed.fijas[0] ?? s.members[0]).therapistId);
const code = ref<Code>(lastCode), fromRaw = ref(1), toRaw = ref(1), busy = ref(false);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const from = computed(() => clamp(Number(fromRaw.value) || 1, 1, n));
const to = computed(() => Math.max(from.value, clamp(Number(toRaw.value) || from.value, 1, n)));
const note = computed(() => {
  const nDays = to.value - from.value + 1, mn = monthName(s.month);
  return t('editor.absence.note', { n: nDays, shift: shiftName(code.value).toLowerCase(), month: mn.toLowerCase(), monthCap: mn }, nDays);
});

async function save() {
  busy.value = true; lastCode = code.value;
  const dto = await ed.addAbsence({ therapistId: who.value, code: code.value, from: from.value, to: to.value });
  busy.value = false;
  if (!dto) return;
  ed.step = Math.max(ed.step, 2);
  emit('close');
  const sup = dto.members.filter(m => m.kind === 'apoyo' && hoursOfRow(m.days) > 0).map(m => `${firstName(m.name)} (${hoursOfRow(m.days)} h)`);
  const detail = dto.rules.support === 'need' ? (sup.length ? t('editor.absence.supportIn', { list: sup.join(', ') }) : t('editor.absence.noSupport')) : t('editor.absence.shared');
  toast(t('editor.absence.toast', { detail }));
}
</script>
<template>
  <ModalDialog :title="t('editor.absence.title')" :sub="t('editor.absence.sub')" @close="emit('close')">
    <form novalidate @submit.prevent="save">
      <div class="fld"><label for="a-p">{{ t('editor.absence.therapist') }}</label>
        <select id="a-p" v-model="who"><option v-for="m in s.members" :key="m.therapistId" :value="m.therapistId">{{ m.name }} ({{ m.kind === 'fija' ? t('editor.absence.staffTag') : t('editor.absence.supportTag') }})</option></select></div>
      <div class="fld"><span>{{ t('editor.absence.type') }}</span>
        <div class="rg"><button type="button" v-for="k in (['V', 'I', 'P'] as Code[])" :key="k" :aria-pressed="code === k" @click="code = k"><ShiftChip :code="k" />{{ shiftName(k) }}</button></div></div>
      <div class="two2">
        <div class="fld"><label for="a-f">{{ t('editor.absence.from') }}</label><input id="a-f" type="number" min="1" :max="n" v-model="fromRaw"></div>
        <div class="fld"><label for="a-t">{{ t('editor.absence.to') }}</label><input id="a-t" type="number" min="1" :max="n" v-model="toRaw"></div>
      </div>
      <p class="note" style="margin:0 0 8px">{{ note }}</p>
      <div class="mact"><button type="button" class="btn" @click="emit('close')">{{ t('editor.absence.cancel') }}</button><button type="submit" class="btn primary" :disabled="busy">{{ t('editor.absence.submit') }}</button></div>
    </form>
  </ModalDialog>
</template>
