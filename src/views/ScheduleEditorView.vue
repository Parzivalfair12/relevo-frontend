<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import type { Issue } from '@/engine';
import { monthName, shiftDesc } from '@/i18n';
import AbsenceDialog from '@/components/editor/AbsenceDialog.vue';
import AlertsPanel from '@/components/editor/AlertsPanel.vue';
import BrushBar from '@/components/editor/BrushBar.vue';
import CellMenu from '@/components/editor/CellMenu.vue';
import DayPopover from '@/components/editor/DayPopover.vue';
import EquityPanel from '@/components/editor/EquityPanel.vue';
import PersonDialog from '@/components/editor/PersonDialog.vue';
import ScheduleGrid from '@/components/editor/ScheduleGrid.vue';
import SideSettings from '@/components/editor/SideSettings.vue';
import StatsRow from '@/components/editor/StatsRow.vue';
import StepsGuide from '@/components/editor/StepsGuide.vue';
import TeamPanel from '@/components/editor/TeamPanel.vue';
import ShiftChip from '@/components/ShiftChip.vue';
import { download, errorText } from '@/lib/api';
import { lockedCount, toTsv } from '@/lib/schedule';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';
import { useEditor } from '@/stores/editor';

const route = useRoute(), router = useRouter(), ed = useEditor(), dir = useDirectory();
const { t } = useI18n();
const menu = ref<{ type: 'cell'; id: string; day: number; rect: DOMRect } | { type: 'day'; day: number; rect: DOMRect } | null>(null);
const dialog = ref<{ type: 'person'; id: string } | { type: 'absence'; id?: string } | null>(null);

const service = computed(() => (ed.s ? dir.service(ed.s.serviceId) : undefined));
const title = computed(() => `${service.value?.name ?? t('editorView.deletedService')} · ${monthName(ed.s!.month)} ${ed.s!.year}`);
const pub = computed(() => ed.s?.status === 'pub');
const nLocked = computed(() => (ed.s ? lockedCount(ed.s) : 0));

async function load() {
  try {
    await Promise.all([dir.loadServices(), dir.loadTherapists({ active: 'true' }), ed.open(String(route.params.id))]);
  } catch (e) { toast(errorText(e)); router.replace({ name: 'schedules' }); }
}
onMounted(load);
watch(() => route.params.id, id => { if (id && route.name === 'editor') load(); });

/* ---- ventanas: una sola abierta a la vez ---- */
function openCell(id: string, day: number, el: HTMLElement) { dialog.value = null; menu.value = { type: 'cell', id, day, rect: el.getBoundingClientRect() }; }
function openDay(day: number, el: HTMLElement) { dialog.value = null; menu.value = { type: 'day', day, rect: el.getBoundingClientRect() }; }
function openDialog(d: NonNullable<typeof dialog.value>) { menu.value = null; dialog.value = d; }
const closeAll = (e: Event) => { if (menu.value && !(e.target as HTMLElement).closest('.menu,[data-p],.dh')) menu.value = null; };
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') menu.value = null; };
const beforeUnload = (e: BeforeUnloadEvent) => { if (ed.hasPending) e.preventDefault(); };
onMounted(() => { document.addEventListener('click', closeAll); document.addEventListener('keydown', onKey); window.addEventListener('beforeunload', beforeUnload); });
onBeforeUnmount(() => { document.removeEventListener('click', closeAll); document.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', beforeUnload); ed.close(); });

/** Al salir se guarda lo pendiente; si no se pudo (conflicto o red), se pregunta antes de perderlo. */
onBeforeRouteLeave(async () => {
  await ed.flush();
  if (ed.hasPending && !window.confirm(t('editorView.unsaved'))) return false;
});

/* ---- acciones de la cabecera ---- */
async function publish() {
  const next = pub.value ? 'bor' : 'pub';
  if (await ed.setStatus(next)) toast(next === 'pub' ? t('editorView.published') : t('editorView.backToDraft'));
}
async function generate(variant: boolean) {
  ed.step = Math.max(ed.step, 3);
  if (await ed.generate(variant)) toast(variant ? t('editorView.newVariant') : t('editorView.generated'));
}
async function unlockAll() { if (await ed.unlockAll()) toast(t('editorView.released')); }
/** Descarga el cuadro en el formato del hospital (la sesión viaja en la petición, por eso no es un enlace simple). */
async function exportAs(format: 'xlsx' | 'ods') {
  try { await ed.flush(); const name = await download(`/schedules/${ed.s!.id}/export?format=${format}`, `cuadro.${format}`); toast(t('editorView.downloaded', { name })); }
  catch (e) { toast(errorText(e)); }
}
async function copy() {
  const tsv = toTsv(ed.s!);
  ed.step = 4;
  try { await navigator.clipboard.writeText(tsv); toast(t('editorView.copied')); } catch { toast(t('editorView.copyFailed')); }
}

/* ---- paso a paso ---- */
function pulse(el: HTMLElement | null) { if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
function step(k: number) {
  ed.step = Math.max(ed.step, k);
  if (k === 1) { pulse(document.getElementById('teamPanel')); toast(t('editorView.step1')); }
  if (k === 2) openDialog({ type: 'absence' });
  if (k === 3) generate(false);
  if (k === 4) { pulse(document.getElementById('gridPanel')); if (ed.brush === 'sel') ed.brush = 'M'; toast(t('editorView.step4')); }
}

/** Una alerta lleva a la casilla (o al día, si es de cobertura) y la resalta un momento. */
function goto(i: Issue) {
  const b = i.id ? document.querySelector(`[data-p="${i.id}"][data-d="${i.day - 1}"]`) : document.querySelector(`tfoot td:nth-child(${i.day + 1})`);
  if (!b) return;
  b.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  b.classList.add('hl'); setTimeout(() => b.classList.remove('hl'), 2200);
}
</script>

<template>
  <main v-if="ed.s">
    <div class="pagehead">
      <div>
        <div class="crumb"><button @click="router.push({ name: 'schedules' })">{{ t('editorView.back') }}</button> / <span>{{ service?.name ?? t('editorView.deletedService') }} · {{ monthName(ed.s.month) }}</span></div>
        <h1>{{ title }}</h1>
        <p><span class="st-pill" :class="ed.s.status">{{ pub ? t('editorView.publishedPill') : t('editorView.draftPill') }}</span> <span style="margin-left:6px">{{ t('editorView.createdBy', { name: ed.s.ownerName }) }}</span></p>
      </div>
      <div class="sp"></div>
      <button class="btn" @click="publish">{{ pub ? t('editorView.toDraft') : t('editorView.publish') }}</button>
      <button class="btn" :title="t('editorView.variantTitle')" @click="generate(true)">{{ t('editorView.variant') }}</button>
      <button class="btn primary" @click="generate(false)">{{ t('editorView.generate') }}</button>
    </div>
    <div class="banner" v-if="ed.conflict" role="alert">
      <b>{{ t('editorView.conflict', { who: ed.conflict.by ?? t('editorView.someone') }) }}</b> {{ t('editorView.conflictKept') }} <button class="link" @click="ed.reloadAfterConflict()">{{ t('editorView.reload') }}</button>
    </div>
    <StepsGuide @step="step" />
    <StatsRow />
    <div class="body">
      <aside class="side">
        <TeamPanel @person="id => openDialog({ type: 'person', id })" @absence="id => openDialog({ type: 'absence', id })" />
        <SideSettings />
      </aside>
      <div class="main">
        <div class="panel" id="gridPanel">
          <BrushBar />
          <div class="scroll"><ScheduleGrid @cell="openCell" @day="openDay" @person="id => openDialog({ type: 'person', id })" /></div>
          <div class="legend" style="margin:10px 0 0">
            <span v-for="k in (['M', 'T', 'N', 'L', 'V', 'I', 'P'] as const)" :key="k"><ShiftChip :code="k" :label="k === 'L' ? 'L' : undefined" />{{ k === 'M' ? t('editorView.legendM') : k === 'T' ? t('editorView.legendT') : k === 'N' ? t('editorView.legendN') : shiftDesc(k) }}</span>
            <span><i class="chip c-L" style="position:relative">·<b style="position:absolute;right:2px;top:2px;width:5px;height:5px;border-radius:50%;background:var(--accent)"></b></i>{{ t('editorView.pinned') }}</span>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn sm" @click="copy">{{ t('editorView.copy') }}</button>
            <button class="btn sm" @click="exportAs('xlsx')">{{ t('editorView.exportXlsx') }}</button>
            <button class="btn sm" @click="exportAs('ods')">{{ t('editorView.exportOds') }}</button>
            <button class="btn sm" :disabled="!nLocked" @click="unlockAll">{{ nLocked ? t('editorView.unlock', { n: nLocked }) : t('editorView.noPinned') }}</button>
          </div>
        </div>
        <div class="two"><EquityPanel /><AlertsPanel @goto="goto" /></div>
      </div>
    </div>
    <CellMenu v-if="menu?.type === 'cell'" :key="`${menu.id}:${menu.day}`" :therapist-id="menu.id" :day="menu.day" :anchor="menu.rect" @close="menu = null" />
    <DayPopover v-if="menu?.type === 'day'" :key="menu.day" :day="menu.day" :anchor="menu.rect" />
    <PersonDialog v-if="dialog?.type === 'person'" :therapist-id="dialog.id" @close="dialog = null" @absence="id => openDialog({ type: 'absence', id })" />
    <AbsenceDialog v-if="dialog?.type === 'absence'" :therapist-id="dialog.id" @close="dialog = null" />
  </main>
</template>
