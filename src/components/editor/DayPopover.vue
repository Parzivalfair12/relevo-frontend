<script setup lang="ts">
import { MESES } from '@/shared';
import ShiftChip from '@/components/ShiftChip.vue';
import { dayLetter, firstName, isOff } from '@/lib/schedule';
import { useEditor } from '@/stores/editor';
import FloatingMenu from './FloatingMenu.vue';

const props = defineProps<{ day: number; anchor: DOMRect }>();
const ed = useEditor();
const s = ed.s!, d = props.day - 1;
const who = (k: 'M' | 'T' | 'N') => s.members.filter(m => { const x = m.days[d]; return x === k || (x === 'MT' && k !== 'N'); }).map(m => m.name);
const absent = s.members.filter(m => isOff(m.days[d]));
</script>
<template>
  <FloatingMenu :anchor="anchor" :width="260" extra="dayp">
    <h4>{{ dayLetter(s.year, s.month, day) }} {{ day }} de {{ MESES[s.month].toLowerCase() }}</h4>
    <div class="dl" v-for="k in (['M', 'T', 'N'] as const)" :key="k">
      <ShiftChip :code="k" /><span><template v-if="who(k).length">{{ who(k).join(', ') }}</template><b v-else style="color:var(--err)">Sin cubrir</b></span>
    </div>
    <div class="dl" v-if="absent.length"><ShiftChip code="I" label="✕" /><span>Ausentes: {{ absent.map(m => firstName(m.name)).join(', ') }}</span></div>
  </FloatingMenu>
</template>
