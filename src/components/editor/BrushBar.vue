<script setup lang="ts">
import { SHIFT_DESC, SHIFT_NAME } from '@/shared';
import ShiftChip from '@/components/ShiftChip.vue';
import { useEditor, type Brush } from '@/stores/editor';

const ed = useEditor();
const tools: [Brush, string][] = [['sel', '☝ Elegir'], ['M', 'M'], ['T', 'T'], ['N', 'N'], ['L', 'L'], ['V', 'V'], ['I', 'I'], ['P', 'P'], ['erase', '⌫ Goma']];
const isShift = (k: Brush): k is Exclude<Brush, 'sel' | 'erase'> => k !== 'sel' && k !== 'erase';
const title = (k: Brush) => (k === 'sel' ? 'Toca una casilla para ver opciones' : k === 'erase' ? 'Suelta casillas fijadas' : SHIFT_DESC[k]);
const hint = () => (ed.brush === 'sel'
  ? 'Toca cualquier casilla para cambiarla, o elige un pincel y arrastra sobre varias casillas para pintarlas de una vez.'
  : ed.brush === 'erase'
    ? 'Arrastra sobre casillas fijadas para soltarlas. Al terminar se recalcula el cuadro.'
    : `Pincel ${SHIFT_NAME[ed.brush]}: haz clic o arrastra sobre el cuadro para pintar. Lo pintado queda fijado.`);
</script>
<template>
  <div class="brush">
    <b>Pincel</b>
    <button class="bt" v-for="[k, label] in tools" :key="k" :data-brush="k" :aria-pressed="ed.brush === k" :title="title(k)" @click="ed.brush = k">
      <template v-if="isShift(k)"><ShiftChip :code="k" />{{ SHIFT_NAME[k].split(' ')[0] }}</template><template v-else>{{ label }}</template>
    </button>
    <span class="hint">{{ hint() }}</span>
  </div>
</template>
