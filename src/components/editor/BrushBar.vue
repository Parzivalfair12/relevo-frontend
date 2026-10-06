<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { shiftDesc, shiftName } from '@/i18n';
import ShiftChip from '@/components/ShiftChip.vue';
import { useEditor, type Brush } from '@/stores/editor';

const { t } = useI18n();
const ed = useEditor();
const tools: [Brush, string][] = [['sel', 'editor.brush.select'], ['M', 'M'], ['T', 'T'], ['N', 'N'], ['L', 'L'], ['V', 'V'], ['I', 'I'], ['P', 'P'], ['erase', 'editor.brush.erase']];
const isShift = (k: Brush): k is Exclude<Brush, 'sel' | 'erase'> => k !== 'sel' && k !== 'erase';
const title = (k: Brush) => (k === 'sel' ? t('editor.brush.titleSelect') : k === 'erase' ? t('editor.brush.titleErase') : shiftDesc(k));
const hint = () => (ed.brush === 'sel'
  ? t('editor.brush.hintSelect')
  : ed.brush === 'erase'
    ? t('editor.brush.hintErase')
    : t('editor.brush.hintShift', { name: shiftName(ed.brush) }));
</script>
<template>
  <div class="brush">
    <b>{{ t('editor.brush.label') }}</b>
    <button class="bt" v-for="[k, label] in tools" :key="k" :data-brush="k" :aria-pressed="ed.brush === k" :title="title(k)" @click="ed.brush = k">
      <template v-if="isShift(k)"><ShiftChip :code="k" />{{ shiftName(k).split(' ')[0] }}</template><template v-else>{{ t(label) }}</template>
    </button>
    <span class="hint">{{ hint() }}</span>
  </div>
</template>
