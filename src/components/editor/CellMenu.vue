<script setup lang="ts">
import { SHIFT_NAME, type ShiftCode } from '@/shared';
import ShiftChip from '@/components/ShiftChip.vue';
import { toast } from '@/lib/toast';
import { useEditor } from '@/stores/editor';
import FloatingMenu from './FloatingMenu.vue';

const props = defineProps<{ therapistId: string; day: number; anchor: DOMRect }>();
const emit = defineEmits<{ close: [] }>();
const ed = useEditor();
const m = ed.s!.members.find(x => x.therapistId === props.therapistId)!;
const codes: ShiftCode[] = ['M', 'T', 'N', 'L', 'MT', 'V', 'I', 'P'];

function set(code: ShiftCode) { ed.paint(props.therapistId, props.day, code); emit('close'); }
async function release() { emit('close'); if (await ed.unlock(props.therapistId, props.day)) toast('Casilla liberada. Se recalculó el cuadro.'); }
</script>
<template>
  <FloatingMenu :anchor="anchor" :width="236">
    <h4>{{ m.name }} · día {{ day + 1 }}</h4>
    <div class="opts">
      <button class="o" v-for="k in codes" :key="k" :class="{ cur: k === m.days[day] }" @click="set(k)"><ShiftChip :code="k" />{{ SHIFT_NAME[k].split(' ')[0] }}</button>
    </div>
    <button v-if="m.locked[day]" class="btn sm un" @click="release">Quitar fijación</button>
  </FloatingMenu>
</template>
