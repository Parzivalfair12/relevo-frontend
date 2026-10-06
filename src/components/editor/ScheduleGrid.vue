<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ScheduleMemberDTO, ShiftCode } from '@/shared';
import { shiftDesc } from '@/i18n';
import { absDays, dayLetter, hoursOfRow, isWeekend } from '@/lib/schedule';
import { useEditor } from '@/stores/editor';

const emit = defineEmits<{ cell: [therapistId: string, day: number, el: HTMLElement]; day: [day: number, el: HTMLElement]; person: [id: string] }>();
const { t } = useI18n();
const ed = useEditor();
const hover = ref<{ id: string; d: number } | null>(null);

const n = computed(() => ed.n);
const days = computed(() => Array.from({ length: n.value }, (_, i) => i + 1));
/** Casillas con alerta: crítica (rojo) o aviso (ámbar). */
const badKey = computed(() => {
  const out: Record<string, string> = {};
  for (const i of ed.issues) if (i.id) { const k = `${i.id}_${i.day}`; out[k] = i.sev === 'err' ? 'bad' : out[k] || 'wn'; }
  return out;
});
const we = (d: number) => isWeekend(ed.s!.year, ed.s!.month, d);
const cnt = (day: number, k: 'M' | 'T' | 'N') => ed.s!.members.reduce((a, m) => { const x = m.days[day - 1]; return a + (x === k || (x === 'MT' && k !== 'N') ? 1 : 0); }, 0);
const hours = (m: ScheduleMemberDTO) => hoursOfRow(m.days);
const off = (m: ScheduleMemberDTO) => { const t = ed.tg[m.therapistId]; return t != null && Math.abs(hours(m) - t) > 6; };
const barW = (m: ScheduleMemberDTO) => { const t = ed.tg[m.therapistId], h = hours(m); return t != null ? Math.min(100, h / Math.max(t * 1.25, 1) * 100) : Math.min(100, h / 1.8); };
const cellTitle = (m: ScheduleMemberDTO, d: number) => t('editor.grid.cellTitle', { name: m.name, day: d + 1, desc: shiftDesc(m.days[d]) }) + (m.locked[d] ? t('editor.grid.cellLocked') : '');

/* ---- pincel: pulsar y arrastrar sobre varias casillas ---- */
let painting = false, lastKey = '', dirtyErase = false;
const cellOf = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.('button[data-p]') as HTMLButtonElement | null;
function apply(b: HTMLButtonElement) {
  const id = b.dataset.p!, d = Number(b.dataset.d);
  if (ed.brush === 'erase') { if (ed.erase(id, d)) dirtyErase = true; } else ed.paint(id, d, ed.brush as ShiftCode);
}
function onDown(e: PointerEvent) {
  const b = cellOf(e.target); if (!b || ed.brush === 'sel') return;
  e.preventDefault(); painting = true; lastKey = `${b.dataset.p}:${b.dataset.d}`; dirtyErase = false; apply(b);
}
function onMove(e: PointerEvent) {
  if (!painting) return;
  const b = cellOf(document.elementFromPoint(e.clientX, e.clientY)), k = b && `${b.dataset.p}:${b.dataset.d}`;
  if (b && k !== lastKey) { lastKey = k!; apply(b); }
}
function onUp() {
  if (!painting) return;
  painting = false;
  if (ed.brush === 'erase' && dirtyErase) void ed.flush(); // soltar casillas recalcula ya; pintar se guarda tras una pausa
}
function onClick(e: MouseEvent) {
  const b = cellOf(e.target);
  if (b && ed.brush === 'sel') emit('cell', b.dataset.p!, Number(b.dataset.d), b);
}
function onOver(e: MouseEvent) { const b = cellOf(e.target); hover.value = b ? { id: b.dataset.p!, d: Number(b.dataset.d) } : null; }
onMounted(() => { document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp); });
onBeforeUnmount(() => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); });
</script>

<template>
  <table class="g" :class="{ paint: ed.brush !== 'sel', erase: ed.brush === 'erase' }" @pointerdown="onDown" @click="onClick" @mouseover="onOver" @mouseleave="hover = null">
    <thead><tr>
      <th class="nm">{{ t('editor.grid.therapist') }}</th>
      <th v-for="d in days" :key="d" class="dh" :class="{ we: we(d), hc: hover?.d === d - 1 }" :data-day="d" :title="t('editor.grid.seeDay', { day: d })" @click="emit('day', d, $event.currentTarget as HTMLElement)">
        <b>{{ d }}</b>{{ dayLetter(ed.s!.year, ed.s!.month, d) }}
      </th>
      <th class="hr">{{ t('editor.grid.hours') }}</th>
    </tr></thead>
    <tbody>
      <template v-for="(group, gi) in [{ label: t('editor.grid.staff'), list: ed.fijas, cls: '' }, { label: t('editor.grid.support'), list: ed.apoyo, cls: 'ap' }]" :key="gi">
        <tr v-if="gi === 0 || group.list.length" class="grp" :class="group.cls"><td :colspan="n + 2">{{ group.label }}</td></tr>
        <tr v-for="m in group.list" :key="m.therapistId" :data-row="m.therapistId" :class="{ sup: m.kind === 'apoyo' }">
          <td class="nm cl" :class="{ hr2: hover?.id === m.therapistId }" :title="m.name" @click="emit('person', m.therapistId)">{{ m.name }}<span class="badge ab" v-if="absDays(m, n)">{{ t('editor.grid.absShort', { n: absDays(m, n) }) }}</span></td>
          <td v-for="d in days" :key="d" :class="{ we: we(d) }">
            <div class="cell"><button :class="['c-' + m.days[d - 1], { lk: m.locked[d - 1] }, badKey[m.therapistId + '_' + d]]" :data-p="m.therapistId" :data-d="d - 1" :title="cellTitle(m, d - 1)" :aria-label="t('editor.grid.cellAria', { name: m.name, day: d, desc: shiftDesc(m.days[d - 1]) })">{{ m.days[d - 1] === 'L' ? '·' : m.days[d - 1] }}</button></div>
          </td>
          <td class="hr"><div class="hb" :class="{ off: off(m) }"><b>{{ hours(m) }} h</b><i><u :style="{ width: barW(m) + '%' }"></u></i></div></td>
        </tr>
      </template>
    </tbody>
    <tfoot><tr>
      <td class="nm">{{ t('editor.grid.coverage') }}</td>
      <td v-for="d in days" :key="d" :class="{ we: we(d) }"><div class="cov">
        <em v-for="k in (['M', 'T', 'N'] as const)" :key="k" :class="cnt(d, k) < ed.s!.coverage[k] ? 'no' : cnt(d, k) > ed.s!.coverage[k] ? 'ex' : ''" :title="`${k}: ${cnt(d, k)}/${ed.s!.coverage[k]}`"></em>
      </div></td>
      <td class="hr"></td>
    </tr></tfoot>
  </table>
</template>
