<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { monthName } from '@/i18n';
import ShiftChip from '@/components/ShiftChip.vue';
import { dayLetter, firstName, isOff } from '@/lib/schedule';
import { useEditor } from '@/stores/editor';
import FloatingMenu from './FloatingMenu.vue';

const props = defineProps<{ day: number; anchor: DOMRect }>();
const { t } = useI18n();
const ed = useEditor();
const s = ed.s!, d = props.day - 1;
const who = (k: 'M' | 'T' | 'N') => s.members.filter(m => { const x = m.days[d]; return x === k || (x === 'MT' && k !== 'N'); }).map(m => m.name);
const absent = s.members.filter(m => isOff(m.days[d]));
</script>
<template>
  <FloatingMenu :anchor="anchor" :width="260" extra="dayp">
    <h4>{{ t('editor.dayPopover.title', { letter: dayLetter(s.year, s.month, day), day, month: monthName(s.month).toLowerCase(), monthCap: monthName(s.month) }) }}</h4>
    <div class="dl" v-for="k in (['M', 'T', 'N'] as const)" :key="k">
      <ShiftChip :code="k" /><span><template v-if="who(k).length">{{ who(k).join(', ') }}</template><b v-else style="color:var(--err)">{{ t('editor.dayPopover.uncovered') }}</b></span>
    </div>
    <div class="dl" v-if="absent.length"><ShiftChip code="I" label="✕" /><span>{{ t('editor.dayPopover.absent', { names: absent.map(m => firstName(m.name)).join(', ') }) }}</span></div>
  </FloatingMenu>
</template>
