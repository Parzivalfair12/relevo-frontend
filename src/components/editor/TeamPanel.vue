<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { Kind, ScheduleMemberDTO } from '@/shared';
import { absDays, hoursOfRow } from '@/lib/schedule';
import { initials } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';
import { useEditor } from '@/stores/editor';

const emit = defineEmits<{ person: [id: string]; absence: [id?: string] }>();
const { t: tr } = useI18n();
const ed = useEditor(), dir = useDirectory(), router = useRouter();
const person = ref(''), kind = ref<Kind>('apoyo');

/** Terapeutas activas que aún no están en el cuadro; primero las del servicio. */
const candidates = computed(() => {
  const inTeam = new Set(ed.s!.members.map(m => m.therapistId)), sv = ed.s!.serviceId;
  return dir.therapists.filter(t => t.active && !inTeam.has(t.id))
    .sort((a, b) => Number(b.serviceIds.includes(sv)) - Number(a.serviceIds.includes(sv)) || a.name.localeCompare(b.name));
});
watch(candidates, c => { if (!c.some(t => t.id === person.value)) person.value = c[0]?.id ?? ''; }, { immediate: true });
/** Al elegir a alguien, el grupo se propone según su tipo por defecto. */
function pick() { const t = dir.therapists.find(x => x.id === person.value); if (t) kind.value = t.defaultKind; }

async function add() {
  const t = dir.therapists.find(x => x.id === person.value);
  if (!t) return toast(tr('editor.team.noMore'));
  const k = kind.value;
  ed.step = Math.max(ed.step, 1);
  if (await ed.addMember(t.id, k)) toast(tr('editor.team.added', { name: t.name, kind: k === 'fija' ? tr('editor.team.kindStaff') : tr('editor.team.kindSupport') }));
}
const mini = (m: ScheduleMemberDTO) => { const ad = absDays(m, ed.n); return tr('editor.team.hoursShort', { n: hoursOfRow(m.days) }) + (ad ? tr('editor.team.miniAbsent', { n: ad }) : ''); };
const groups = computed(() => [
  { t: tr('editor.team.staffGroup'), l: ed.fijas, empty: tr('editor.team.staffEmpty') },
  { t: tr('editor.team.supportGroup'), l: ed.apoyo, empty: tr('editor.team.supportEmpty') }
]);
</script>
<template>
  <div class="panel team" id="teamPanel">
    <h3>{{ tr('editor.team.title') }} <span style="color:var(--muted);font-weight:500">{{ tr('editor.team.counts', { staff: ed.fijas.length, support: ed.apoyo.length }) }}</span></h3>
    <p class="note" style="margin:0 0 4px">{{ tr('editor.team.help') }}</p>
    <template v-for="g in groups" :key="g.t">
      <div class="grp-h"><span>{{ g.t }}</span></div>
      <ul>
        <li v-for="m in g.l" :key="m.therapistId" @click="emit('person', m.therapistId)">
          <span class="av">{{ initials(m.name) }}</span>
          <span class="nm" :title="m.name">{{ m.name }}<br><span class="mini">{{ mini(m) }}</span></span>
          <button class="mv" :title="tr('editor.team.addAbsenceTitle')" @click.stop="emit('absence', m.therapistId)">{{ tr('editor.team.addAbsenceShort') }}</button>
        </li>
        <li class="empty" v-if="!g.l.length">{{ g.empty }}</li>
      </ul>
    </template>
    <form class="add" @submit.prevent="add">
      <select v-model="person" :aria-label="tr('editor.team.directoryAria')" style="flex:1;min-width:0;max-width:none" @change="pick">
        <option v-for="t in candidates" :key="t.id" :value="t.id">{{ t.name }}{{ t.serviceIds.includes(ed.s!.serviceId) ? '' : tr('editor.team.otherService') }}</option>
        <option v-if="!candidates.length" value="">{{ tr('editor.team.allIn') }}</option>
      </select>
      <select v-model="kind" :aria-label="tr('editor.team.groupAria')"><option value="apoyo">{{ tr('editor.team.support') }}</option><option value="fija">{{ tr('editor.team.staffKind') }}</option></select>
      <button class="btn sm primary" type="submit">{{ tr('editor.team.add') }}</button>
    </form>
    <p class="note" style="margin:6px 0 0">{{ tr('editor.team.notListed') }} <button class="link" type="button" @click="router.push({ name: 'team' })">{{ tr('editor.team.registerLink') }}</button>.</p>
    <button class="btn" style="width:100%;margin-top:12px;justify-content:center" @click="emit('absence')">{{ tr('editor.team.addAbsence') }}</button>
  </div>
</template>
