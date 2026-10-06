<script setup lang="ts">
import { computed } from 'vue';
import { MESES, SHIFT_NAME, type Kind } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import ShiftChip from '@/components/ShiftChip.vue';
import { absDays, absRanges, firstName, hoursOfRow, nightsOf, weekendWorkOf } from '@/lib/schedule';
import { toast } from '@/lib/toast';
import { useEditor } from '@/stores/editor';

const props = defineProps<{ therapistId: string }>();
const emit = defineEmits<{ close: []; absence: [id: string] }>();
const ed = useEditor();
const m = computed(() => ed.s!.members.find(x => x.therapistId === props.therapistId));
const n = ed.n;
const st = computed(() => {
  const mm = m.value!, g = mm.days, libres = g.filter(x => x === 'L').length, ad = absDays(mm, n);
  return { h: hoursOfRow(g), tg: ed.tg[mm.therapistId], nights: nightsOf(g), we: weekendWorkOf(g, ed.s!.year, ed.s!.month), libres, ad, worked: n - libres - ad };
});
const ranges = computed(() => absRanges(m.value!, n));

async function setKind(k: Kind) {
  const name = firstName(m.value!.name);
  emit('close');
  if (await ed.setKind(props.therapistId, k)) toast(`${name} ahora es de ${k === 'fija' ? 'planta' : 'apoyo'}`);
}
async function removeAbsence(i: number) {
  const r = ranges.value[i];
  emit('close'); // como en el mockup, el diálogo se cierra al quitar una ausencia
  if (await ed.removeAbsence({ therapistId: props.therapistId, from: r.from, to: r.to })) toast('Ausencia eliminada');
}
async function removeMember() {
  if (ed.s!.members.length <= 2) return toast('Se necesitan al menos 2 terapeutas');
  const name = firstName(m.value!.name);
  emit('close');
  if (await ed.removeMember(props.therapistId)) toast(`${name} salió del equipo`);
}
</script>
<template>
  <ModalDialog v-if="m" :title="m.name" :sub="`${m.kind === 'fija' ? 'Terapeuta de planta' : 'Terapeuta de apoyo'} · ${MESES[ed.s!.month]} ${ed.s!.year}`" @close="emit('close')">
    <div class="seg"><button v-for="[k, l] in ([['fija', 'Planta'], ['apoyo', 'Apoyo']] as [Kind, string][])" :key="k" :aria-pressed="m.kind === k" @click="setKind(k)">{{ l }}</button></div>
    <div class="pst">
      <div><b>{{ st.h }} h</b><span>{{ st.tg != null ? 'Meta ' + st.tg.toFixed(0) + ' h' : 'Horas del mes' }}</span></div>
      <div><b>{{ st.nights }}</b><span>Noches</span></div>
      <div><b>{{ st.we }}</b><span>Turnos fin de semana</span></div>
      <div><b>{{ st.libres }}</b><span>Días libres</span></div>
      <div><b>{{ st.ad }}</b><span>Días de ausencia</span></div>
      <div><b>{{ st.worked }}</b><span>Días trabajados</span></div>
    </div>
    <div class="grp-h"><span>Ausencias del mes</span></div>
    <div class="alist">
      <div class="ai" v-for="(r, i) in ranges" :key="i"><ShiftChip :code="r.code" /><span>{{ SHIFT_NAME[r.code] }} · {{ r.from === r.to ? 'día ' + r.from : 'días ' + r.from + ' al ' + r.to }}</span><button class="x" aria-label="Quitar ausencia" @click="removeAbsence(i)">✕</button></div>
      <div class="empty" v-if="!ranges.length">Sin ausencias registradas.</div>
    </div>
    <div class="mact"><button class="btn danger" @click="removeMember">Quitar del equipo</button><button class="btn" @click="emit('absence', therapistId)">＋ Ausencia</button><button class="btn primary" @click="emit('close')">Listo</button></div>
  </ModalDialog>
</template>
