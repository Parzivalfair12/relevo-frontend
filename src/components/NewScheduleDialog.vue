<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { monthName } from '@/i18n';
import { type NewScheduleProposalDTO, type ScheduleDTO, type ServiceDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { api, errorText, post } from '@/lib/api';
import { chosen, countKinds, effectiveHours, goalTotal, initialPlan, MAX_HOURS, neededHours, overlaps, problemOf, teamPayload, type Plan, type PlanRow } from '@/lib/newSchedule';
import { monthOptions } from '@/lib/schedule';
import { toast } from '@/lib/toast';

const props = defineProps<{ services: ServiceDTO[] }>();
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const router = useRouter();

const options = monthOptions();
const cur = options.find(o => o.current)!;
const svc = ref(props.services[0].id), month = ref(`${cur.year}-${cur.month}`);
const ym = computed(() => month.value.split('-').map(Number) as [number, number]);
const prevMonth = computed<[number, number]>(() => (ym.value[1] === 0 ? [ym.value[0] - 1, 11] : [ym.value[0], ym.value[1] - 1]));
const svcName = computed(() => props.services.find(s => s.id === svc.value)?.name ?? '');

const step = ref(1), busy = ref(false), loading = ref(true), error = ref(''), showOthers = ref(false);
const proposal = ref<NewScheduleProposalDTO | null>(null), plan = ref<Plan | null>(null);
let req = 0;

/** Cada vez que cambia el servicio o el mes se pide de nuevo la propuesta (equipo, tipos y metas del mes anterior). */
async function loadProposal() {
  const n = ++req;
  loading.value = true; error.value = ''; proposal.value = null; plan.value = null;
  try {
    const q = new URLSearchParams({ serviceId: svc.value, year: String(ym.value[0]), month: String(ym.value[1]) });
    const p = await api<NewScheduleProposalDTO>(`/schedules/proposal?${q}`);
    if (n !== req) return;
    proposal.value = p; plan.value = initialPlan(p);
  } catch (e) { if (n === req) error.value = errorText(e); } finally { if (n === req) loading.value = false; }
}
watch([svc, month], loadProposal, { immediate: true });

const visible = computed(() => (plan.value?.rows ?? []).filter(r => r.inService || r.selected || showOthers.value));
const hiddenCount = computed(() => (plan.value?.rows ?? []).filter(r => !r.inService && !r.selected).length);
const problem = computed(() => (plan.value ? problemOf(plan.value) : 'min'));
const kinds = computed(() => (plan.value ? countKinds(plan.value) : { planta: 0, apoyo: 0 }));
const days = computed(() => proposal.value?.days ?? 0);
const needed = computed(() => (proposal.value ? neededHours(proposal.value.coverage, days.value) : 0));
const assigned = computed(() => (plan.value ? goalTotal(plan.value) : 0));
const crossings = computed(() => (plan.value ? overlaps(plan.value) : []));
const goalRows = computed(() => (plan.value?.mode === 'goal' ? chosen(plan.value).filter(r => r.kind === 'fija') : []));
const goalMode = computed(() => plan.value?.mode === 'goal');
const showsHours = (r: PlanRow) => goalMode.value && r.selected && r.kind === 'fija';
const dup = computed(() => !!proposal.value?.exists);

const problemText = computed(() => (problem.value === 'min' ? t('dialogs.newSchedule.team.min') : problem.value === 'goal' ? t('dialogs.newSchedule.hours.goalMissing') : problem.value === 'range' ? t('dialogs.newSchedule.hours.range', { max: MAX_HOURS }) : ''));
const canNext = computed(() => !!plan.value && !dup.value && !loading.value && !problem.value);
const stepName = computed(() => t(`dialogs.newSchedule.steps.${['team', 'confirm'][step.value - 1]}`));
const hoursSummary = computed(() => {
  if (!plan.value || plan.value.mode !== 'goal') return t('dialogs.newSchedule.confirm.hoursAuto');
  const goals = [...new Set(goalRows.value.map(r => effectiveHours(plan.value!, r)))];
  return goals.length === 1 ? t('dialogs.newSchedule.confirm.hoursGoal', { h: goals[0] }) : t('dialogs.newSchedule.confirm.hoursMixed', { min: Math.min(...(goals as number[])), max: Math.max(...(goals as number[])) });
});

const parseHours = (v: string) => (v.trim() === '' ? null : Number(v));
const setGoal = (e: Event) => { plan.value!.goal = parseHours((e.target as HTMLInputElement).value); };
const setOverride = (r: PlanRow, e: Event) => {
  const v = parseHours((e.target as HTMLInputElement).value);
  r.override = v === plan.value!.goal ? null : v; // si coincide con la meta del cuadro deja de ser un ajuste
};
const toggle = (r: PlanRow, e: Event) => { r.selected = (e.target as HTMLInputElement).checked; };
const setMode = (mode: Plan['mode']) => { plan.value!.mode = mode; };

async function create() {
  if (!plan.value || problem.value || dup.value) return;
  busy.value = true; error.value = '';
  try {
    const s = await post<ScheduleDTO>('/schedules', { serviceId: svc.value, year: ym.value[0], month: ym.value[1], team: teamPayload(plan.value) });
    emit('close');
    await router.push({ name: 'editor', params: { id: s.id } });
    toast(proposal.value?.hasPrevious ? t('dialogs.newSchedule.createdContinues', { month: monthName(prevMonth.value[1]).toLowerCase() }) : t('dialogs.newSchedule.created'));
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
const next = () => { if (canNext.value) step.value = 2; };
</script>

<template>
  <ModalDialog wide :title="t('dialogs.newSchedule.title')" :sub="t('dialogs.newSchedule.sub')" @close="emit('close')">
    <p class="note" style="margin:0 0 10px" aria-live="polite">{{ t('dialogs.newSchedule.stepOf', { n: step, name: stepName }) }}</p>

    <!-- Paso 1: servicio, mes, horas y equipo -->
    <form v-if="step === 1" novalidate @submit.prevent="next">
      <div class="two2">
        <div class="fld"><label for="n-s">{{ t('dialogs.newSchedule.service') }}</label><select id="n-s" v-model="svc"><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
        <div class="fld"><label for="n-m">{{ t('dialogs.newSchedule.month') }}</label>
          <select id="n-m" v-model="month"><option v-for="o in options" :key="`${o.year}-${o.month}`" :value="`${o.year}-${o.month}`">{{ monthName(o.month) }} {{ o.year }}</option></select></div>
      </div>
      <p class="note" v-if="loading" style="margin:0 0 8px">{{ t('dialogs.newSchedule.team.loading') }}</p>
      <p class="err-box" v-else-if="dup">{{ t('dialogs.newSchedule.dup') }}</p>
      <template v-else-if="plan && proposal">
        <div class="panel">
          <div class="fld" style="margin:0"><span id="n-mode">{{ t('dialogs.newSchedule.hours.mode') }}</span>
            <div class="seg" role="group" aria-labelledby="n-mode">
              <button type="button" :aria-pressed="!goalMode" @click="setMode('auto')">{{ t('dialogs.newSchedule.hours.auto') }}</button>
              <button type="button" :aria-pressed="goalMode" @click="setMode('goal')">{{ t('dialogs.newSchedule.hours.goal') }}</button>
            </div></div>
          <div class="fld goal" v-if="goalMode" style="margin:12px 0 0">
            <label for="n-goal">{{ t('dialogs.newSchedule.hours.goalLabel') }}</label>
            <div class="hrs big"><input id="n-goal" type="number" min="0" :max="MAX_HOURS" step="1" inputmode="numeric" :value="plan.goal ?? ''" :placeholder="t('dialogs.newSchedule.hours.placeholder')" @input="setGoal"><span aria-hidden="true">h</span></div>
          </div>
          <p class="note" style="margin:8px 0 0" v-if="!goalMode">{{ t('dialogs.newSchedule.hours.autoNote', { needed }) }}</p>
          <p class="note" style="margin:8px 0 0" v-else-if="!problem">{{ t('dialogs.newSchedule.hours.reference', { m: proposal.coverage.M, t: proposal.coverage.T, n: proposal.coverage.N, needed, assigned }) }}
            <b v-if="assigned < needed"> {{ t('dialogs.newSchedule.hours.short', { diff: needed - assigned }) }}</b></p>
          <p class="err-box" style="margin-top:8px" v-if="problem && problem !== 'min'">{{ problemText }}</p>
        </div>

        <p class="note" style="margin:12px 0 4px">{{ proposal.hasPrevious ? t('dialogs.newSchedule.copyPrev', { month: monthName(prevMonth[1]).toLowerCase() }) : t('dialogs.newSchedule.useActive', { n: plan.rows.filter(r => r.selected).length }) }}</p>
        <div role="group" :aria-label="t('dialogs.newSchedule.team.label')" class="list">
          <div v-for="r in visible" :key="r.therapistId" class="row" :class="{ off: !r.selected }">
            <label class="who">
              <input type="checkbox" :checked="r.selected" @change="toggle(r, $event)">
              <span class="nm">{{ r.name }}<small v-if="!r.inService">{{ t('dialogs.newSchedule.team.otherService') }}</small></span>
            </label>
            <div class="seg kind" role="group" :aria-label="t('dialogs.newSchedule.team.kindOf', { name: r.name })">
              <button type="button" :aria-pressed="r.kind === 'fija'" :disabled="!r.selected" @click="r.kind = 'fija'">{{ t('dialogs.newSchedule.team.planta') }}</button>
              <button type="button" :aria-pressed="r.kind === 'apoyo'" :disabled="!r.selected" @click="r.kind = 'apoyo'">{{ t('dialogs.newSchedule.team.apoyo') }}</button>
            </div>
            <div class="hrs" v-if="showsHours(r)"><input type="number" min="0" :max="MAX_HOURS" step="1" inputmode="numeric" :value="r.override ?? ''" :placeholder="plan.goal === null ? '' : String(plan.goal)" :aria-label="t('dialogs.newSchedule.hours.personAria', { name: r.name })" @input="setOverride(r, $event)"><span aria-hidden="true">h</span></div>
            <span class="none" v-else-if="goalMode && r.selected">{{ t('dialogs.newSchedule.hours.noTarget') }}</span>
            <small class="warn" v-if="r.selected && r.elsewhere.length">{{ t('dialogs.newSchedule.team.elsewhere', { services: r.elsewhere.join(', ') }) }}</small>
          </div>
        </div>
        <p class="note" style="margin:8px 0 0" v-if="goalMode">{{ t('dialogs.newSchedule.hours.supportNote') }}</p>
        <p class="note" style="margin:8px 0 0"><button type="button" class="btn sm" v-if="hiddenCount" @click="showOthers = !showOthers">{{ showOthers ? t('dialogs.newSchedule.team.hideOthers') : t('dialogs.newSchedule.team.showOthers', { n: hiddenCount }) }}</button></p>
        <p class="note" style="margin:8px 0 0"><b>{{ t('dialogs.newSchedule.team.count', { n: chosen(plan).length, planta: kinds.planta, apoyo: kinds.apoyo }) }}</b></p>
        <p class="err-box" v-if="problem === 'min'">{{ problemText }}</p>
      </template>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact stick"><button type="button" class="btn" @click="emit('close')">{{ t('common.cancel') }}</button><button type="submit" class="btn primary" :disabled="!canNext">{{ t('dialogs.newSchedule.next') }}</button></div>
    </form>

    <!-- Paso 2: confirmación -->
    <form v-else-if="plan && proposal" novalidate @submit.prevent="create">
      <dl class="sum">
        <dt>{{ t('dialogs.newSchedule.service') }}</dt><dd><b>{{ svcName }}</b></dd>
        <dt>{{ t('dialogs.newSchedule.month') }}</dt><dd>{{ monthName(ym[1]) }} {{ ym[0] }} · {{ t('dialogs.newSchedule.confirm.days', { n: days }) }}</dd>
        <dt>{{ t('dialogs.newSchedule.confirm.team') }}</dt><dd>{{ t('dialogs.newSchedule.confirm.teamLine', { n: chosen(plan).length, planta: kinds.planta, apoyo: kinds.apoyo }) }}</dd>
        <dt>{{ t('dialogs.newSchedule.confirm.hours') }}</dt><dd>{{ hoursSummary }}</dd>
        <dt>{{ t('dialogs.newSchedule.confirm.coverage') }}</dt><dd>{{ proposal.coverage.M }}/{{ proposal.coverage.T }}/{{ proposal.coverage.N }}</dd>
      </dl>
      <ul class="people">
        <li v-for="r in chosen(plan)" :key="r.therapistId"><span>{{ r.name }}</span><span class="note" style="margin:0">{{ r.kind === 'fija' ? t('dialogs.newSchedule.team.planta') : t('dialogs.newSchedule.team.apoyo') }}<template v-if="effectiveHours(plan, r) !== null"> · {{ effectiveHours(plan, r) }} h</template></span></li>
      </ul>
      <div class="err-box" v-if="crossings.length || (plan.mode === 'goal' && assigned < needed)">
        <div v-for="c in crossings" :key="c.name">{{ t('dialogs.newSchedule.confirm.overlap', { name: c.name, services: c.services.join(', ') }) }}</div>
        <div v-if="plan.mode === 'goal' && assigned < needed">{{ t('dialogs.newSchedule.confirm.short', { needed, assigned }) }}</div>
      </div>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact"><button type="button" class="btn" @click="step = 1" :disabled="busy">{{ t('dialogs.newSchedule.back') }}</button><button type="submit" class="btn primary" :disabled="busy || !!problem || dup">{{ t('dialogs.newSchedule.create') }}</button></div>
    </form>
  </ModalDialog>
</template>

<style scoped>
.panel { background: var(--surface2); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
.list { max-height: 27vh; min-height: 120px; overflow: auto; }
.row { display: grid; grid-template-columns: minmax(0, 1fr) 150px 96px; gap: 8px 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
.row.off .nm { color: var(--muted); font-weight: 500; }
.who { display: flex; align-items: center; gap: 10px; min-width: 0; text-transform: none; letter-spacing: 0; font-size: inherit; font-weight: 600; color: var(--ink); }
.who input { width: 18px; height: 18px; flex: none; accent-color: var(--accent); margin: 0; }
.nm small { color: var(--muted); font-weight: 400; margin-left: 4px; }
.kind button:disabled { opacity: .5; }
.hrs { position: relative; }
.hrs input { width: 100%; border: 1px solid var(--line); background: var(--surface); border-radius: 10px; padding: 8px 26px 8px 10px; text-align: right; appearance: textfield; -moz-appearance: textfield; }
.hrs input::-webkit-outer-spin-button, .hrs input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.hrs span { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 12.5px; pointer-events: none; }
.hrs.big { max-width: 180px; }
.hrs.big input { padding: 11px 28px 11px 12px; font-size: 18px; font-weight: 600; background: var(--surface); }
.none { color: var(--muted); font-size: 12.5px; text-align: right; }
.warn { grid-column: 1 / -1; color: var(--warn); font-size: 12.5px; margin-top: -4px; }
.stick { position: sticky; bottom: -22px; margin: 10px -22px -22px; padding: 12px 22px; background: var(--surface); border-top: 1px solid var(--line); border-radius: 0 0 18px 18px; }
.sum { margin: 0 0 8px; display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; }
.sum dt { color: var(--muted); font-size: 12.5px; }
.sum dd { margin: 0; }
.people { list-style: none; margin: 0 0 10px; padding: 0; max-height: 26vh; overflow: auto; border-top: 1px solid var(--line); }
.people li { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--line); }
@media (max-width: 480px) {
  .row { grid-template-columns: minmax(0, 1fr) 140px; }
  .row .hrs, .row .none { grid-column: 1 / -1; }
  .row .none { text-align: left; }
}
</style>
