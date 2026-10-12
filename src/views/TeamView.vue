<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TherapistDTO } from '@/shared';
import { positionLabel } from '@/i18n';
import PageHead from '@/components/PageHead.vue';
import TherapistFormDialog from '@/components/TherapistFormDialog.vue';
import { errorText } from '@/lib/api';
import { initials } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useAuth } from '@/stores/auth';
import { useDirectory } from '@/stores/directory';

const auth = useAuth(), dir = useDirectory();
const { t } = useI18n();
const q = ref(''), svc = ref('all'), kind = ref('all'), act = ref('act');
const form = ref<{ therapist: TherapistDTO | null } | null>(null);
const loaded = ref(false), pageNo = ref(1);
const PAGE_SIZE = 25;

/** Los filtros viajan al servidor; la búsqueda espera un instante para no consultar en cada tecla. */
async function load() {
  try {
    await dir.loadTherapistPage({
      q: q.value.trim(), service: svc.value === 'all' ? '' : svc.value, kind: kind.value === 'all' ? '' : kind.value,
      active: act.value === 'all' ? '' : act.value === 'act' ? 'true' : 'false'
    }, pageNo.value, PAGE_SIZE);
    // Si se borró lo último de la última página (o los filtros dejan menos páginas), se vuelve a la última que exista
    const last = Math.max(1, Math.ceil(dir.page.total / PAGE_SIZE));
    if (pageNo.value > last) { pageNo.value = last; await load(); return; }
  } catch (e) { toast(errorText(e)); }
  loaded.value = true;
}
let timer: ReturnType<typeof setTimeout>;
// Cualquier cambio de filtro vuelve a la primera página
watch(q, () => { clearTimeout(timer); pageNo.value = 1; timer = setTimeout(load, 250); });
watch([svc, kind, act], () => { pageNo.value = 1; void load(); });
const go = (p: number) => { pageNo.value = p; void load(); };
onMounted(async () => { await Promise.all([dir.loadServices().catch(() => {}), load()]); });
onBeforeUnmount(() => clearTimeout(timer));

const rows = computed(() => dir.page.items);
const pages = computed(() => Math.max(1, Math.ceil(dir.page.total / PAGE_SIZE)));
const fromN = computed(() => (dir.page.total ? (pageNo.value - 1) * PAGE_SIZE + 1 : 0));
const toN = computed(() => Math.min(pageNo.value * PAGE_SIZE, dir.page.total));
function saved() { form.value = null; load(); }
</script>

<template>
  <main>
    <PageHead :title="t('team.title')" :subtitle="t('team.sub')">
      <button v-if="auth.isAdmin" class="btn primary" @click="form = { therapist: null }">{{ t('team.register') }}</button>
    </PageHead>
    <div class="banner" v-if="!auth.isAdmin">{{ t('team.adminOnly') }}</div>
    <div class="filters">
      <input v-model="q" :placeholder="t('team.searchPlaceholder')" :aria-label="t('team.search')" style="min-width:240px">
      <select v-model="svc" :aria-label="t('team.service')"><option value="all">{{ t('team.allServices') }}</option><option v-for="s in dir.services" :key="s.id" :value="s.id">{{ s.name }}</option></select>
      <select v-model="kind" :aria-label="t('team.type')"><option value="all">{{ t('team.both') }}</option><option value="fija">{{ t('team.onlyPermanent') }}</option><option value="apoyo">{{ t('team.onlySupport') }}</option></select>
      <select v-model="act" :aria-label="t('team.status')"><option value="act">{{ t('team.actives') }}</option><option value="ina">{{ t('team.inactives') }}</option><option value="all">{{ t('team.all') }}</option></select>
    </div>
    <div class="tw2">
      <table class="tbl">
        <thead><tr><th>{{ t('team.col.therapist') }}</th><th>{{ t('team.col.document') }}</th><th>{{ t('team.col.position') }}</th><th>{{ t('team.col.type') }}</th><th>{{ t('team.col.services') }}</th><th>{{ t('team.col.schedules') }}</th><th>{{ t('team.col.status') }}</th></tr></thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id" tabindex="0" @click="form = { therapist: p }" @keydown.enter="form = { therapist: p }">
            <td><div class="who2"><span class="av">{{ initials(p.name) }}</span>{{ p.name }}</div></td>
            <td>{{ p.document }}</td>
            <td>{{ positionLabel(p.position) }}</td>
            <td><span class="pl" :class="{ apoyo: p.defaultKind === 'apoyo' }">{{ p.defaultKind === 'fija' ? t('team.permanent') : t('team.support') }}</span></td>
            <td><div class="pills">
              <template v-for="id in p.serviceIds" :key="id"><span class="pl" v-if="dir.service(id)"><span class="svdot" :style="{ background: dir.service(id)!.color, marginRight: '4px', width: '7px', height: '7px' }"></span>{{ dir.service(id)!.name }}</span></template>
              <span class="empty" v-if="!p.serviceIds.length">{{ t('team.noService') }}</span>
            </div></td>
            <td>{{ p.scheduleCount }}</td>
            <td><span class="st-pill" :class="p.active ? 'pub' : 'bor'">{{ p.active ? t('team.active') : t('team.inactive') }}</span></td>
          </tr>
          <tr v-if="loaded && !rows.length"><td colspan="7" class="empty">{{ t('team.empty') }}</td></tr>
        </tbody>
      </table>
    </div>
    <nav class="pager" v-if="dir.page.total > PAGE_SIZE" :aria-label="t('team.pager.label')">
      <span class="note" style="margin:0" role="status">{{ t('team.pager.showing', { from: fromN, to: toN, total: dir.page.total }) }}</span>
      <button type="button" class="btn sm" :disabled="pageNo <= 1" @click="go(pageNo - 1)">{{ t('team.pager.prev') }}</button>
      <span class="note" style="margin:0">{{ t('team.pager.page', { p: pageNo, n: pages }) }}</span>
      <button type="button" class="btn sm" :disabled="pageNo >= pages" @click="go(pageNo + 1)">{{ t('team.pager.next') }}</button>
    </nav>
    <TherapistFormDialog v-if="form" :therapist="form.therapist" :readonly="!auth.isAdmin" @close="form = null" @saved="saved" />
  </main>
</template>

<style scoped>
/* Valores del mockup (chip "Apoyo" del directorio), que allí iban en línea */
.pl.apoyo { background: var(--amber-bg); color: var(--amber-fg); }
.pager { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
</style>
