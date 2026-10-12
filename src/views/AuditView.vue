<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { AUDIT_ACTIONS, AUDIT_ENTITIES, type AuditEntryDTO, type AuditPageDTO } from '@/shared';
import PageHead from '@/components/PageHead.vue';
import { api, errorText } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';

const dir = useDirectory();
const { t, locale } = useI18n();
const q = ref(''), entity = ref('all'), action = ref('all'), person = ref('all'), from = ref(''), to = ref('');
const items = ref<AuditEntryDTO[]>([]), cursor = ref<string | null>(null), retentionDays = ref(0);
const loading = ref(true), loadingMore = ref(false);
let req = 0;

const badRange = computed(() => !!from.value && !!to.value && from.value > to.value);
const filtered = computed(() => q.value.trim() !== '' || entity.value !== 'all' || action.value !== 'all' || person.value !== 'all' || from.value !== '' || to.value !== '');

/** Los filtros viajan al servidor. Las fechas son días de la usuaria: «Desde» es el inicio de ese día y «Hasta» su final. */
function params(after?: string | null) {
  const p = new URLSearchParams({ limit: '50' });
  if (q.value.trim()) p.set('q', q.value.trim());
  if (entity.value !== 'all') p.set('entity', entity.value);
  if (action.value !== 'all') p.set('action', action.value);
  if (person.value !== 'all') p.set('user', person.value);
  if (from.value) p.set('from', new Date(`${from.value}T00:00:00`).toISOString());
  if (to.value) p.set('to', new Date(`${to.value}T23:59:59.999`).toISOString());
  if (after) p.set('cursor', after);
  return p;
}
/** Si dos consultas se cruzan (escribiendo rápido), solo vale la última. */
async function load() {
  const n = ++req;
  if (badRange.value) { items.value = []; cursor.value = null; loading.value = false; return; }
  loading.value = true;
  try {
    const page = await api<AuditPageDTO>(`/audit?${params()}`);
    if (n !== req) return;
    items.value = page.items; cursor.value = page.nextCursor; retentionDays.value = page.retentionDays;
  } catch (e) { if (n === req) toast(errorText(e)); } finally { if (n === req) loading.value = false; }
}
async function more() {
  if (!cursor.value || loadingMore.value) return;
  const n = req; loadingMore.value = true;
  try {
    const page = await api<AuditPageDTO>(`/audit?${params(cursor.value)}`);
    if (n !== req) return;
    items.value = items.value.concat(page.items); cursor.value = page.nextCursor;
  } catch (e) { toast(errorText(e)); } finally { loadingMore.value = false; }
}
function clear() { q.value = ''; entity.value = 'all'; action.value = 'all'; person.value = 'all'; from.value = ''; to.value = ''; }

let timer: ReturnType<typeof setTimeout>;
watch(q, () => { clearTimeout(timer); timer = setTimeout(load, 300); });
watch([entity, action, person, from, to], load);
onMounted(async () => { await Promise.all([dir.loadUsers().catch(() => {}), load()]); });
onBeforeUnmount(() => clearTimeout(timer));

const when = (iso: string) => new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' });
const who = (e: AuditEntryDTO) => e.userName ?? (e.userId ? t('audit.removedPerson') : '—');
</script>

<template>
  <main>
    <PageHead :title="t('audit.title')" :subtitle="t('audit.sub')" />
    <p class="note" style="margin:-6px 0 14px">{{ retentionDays > 0 ? t('audit.retention', { n: retentionDays }) : t('audit.retentionNone') }}</p>
    <div class="filters">
      <input v-model="q" :placeholder="t('audit.searchPlaceholder')" :aria-label="t('audit.search')" style="min-width:260px">
      <select v-model="entity" :aria-label="t('audit.entity')"><option value="all">{{ t('audit.allEntities') }}</option><option v-for="e in AUDIT_ENTITIES" :key="e" :value="e">{{ t(`audit.entities.${e}`) }}</option></select>
      <select v-model="action" :aria-label="t('audit.action')"><option value="all">{{ t('audit.allActions') }}</option><option v-for="a in AUDIT_ACTIONS" :key="a" :value="a">{{ t(`audit.actions.${a}`) }}</option></select>
      <select v-model="person" :aria-label="t('audit.person')"><option value="all">{{ t('audit.allPeople') }}</option><option v-for="u in dir.users" :key="u.id" :value="u.id">{{ u.name }}</option></select>
      <label class="dt">{{ t('audit.from') }} <input type="date" v-model="from" :max="to || undefined"></label>
      <label class="dt">{{ t('audit.to') }} <input type="date" v-model="to" :min="from || undefined"></label>
      <button type="button" class="btn sm" v-if="filtered" @click="clear">{{ t('audit.clear') }}</button>
    </div>
    <p class="err-box" v-if="badRange" role="alert" style="margin-bottom:12px">{{ t('audit.badRange') }}</p>
    <div class="tw2">
      <table class="tbl" :aria-label="t('audit.caption')" :aria-busy="loading">
        <thead><tr><th>{{ t('audit.col.when') }}</th><th>{{ t('audit.col.person') }}</th><th>{{ t('audit.col.what') }}</th><th>{{ t('audit.col.detail') }}</th></tr></thead>
        <tbody>
          <tr v-for="e in items" :key="e.id">
            <td style="white-space:nowrap"><time :datetime="e.at">{{ when(e.at) }}</time></td>
            <td>{{ who(e) }}</td>
            <td style="white-space:nowrap"><span class="pl">{{ t(`audit.actions.${e.action}`) }}</span> <span class="note" style="margin:0">{{ t(`audit.entities.${e.entity}`) }}</span></td>
            <td>{{ e.summary }}</td>
          </tr>
          <tr v-if="!items.length"><td colspan="4" class="note" style="text-align:center;padding:22px">{{ loading ? t('audit.loading') : t('audit.empty') }}</td></tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-top:12px" v-if="items.length">
      <span class="note" style="margin:0" role="status">{{ t('audit.showing', { n: items.length }) }}</span>
      <button type="button" class="btn sm" v-if="cursor" :disabled="loadingMore" @click="more">{{ t('audit.more') }}</button>
    </div>
  </main>
</template>

<style scoped>
.dt { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 13px; }
</style>
