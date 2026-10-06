<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { MESES, type ImportBatchResultDTO, type ImportPreviewDTO, type ImportTableDTO, type ServiceDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { errorText, post, upload } from '@/lib/api';
import { initialSetups, membersOf, problemOf, summarize, type TableSetup } from '@/lib/import';
import { daysIn } from '@/lib/schedule';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';
import { useSchedules } from '@/stores/schedules';

const props = defineProps<{ services: ServiceDTO[] }>();
const emit = defineEmits<{ close: [] }>();
const router = useRouter(), dir = useDirectory(), list = useSchedules();

const file = ref<File | null>(null), busy = ref(false), error = ref('');
const preview = ref<ImportPreviewDTO | null>(null), setups = reactive<Record<string, TableSetup>>({});
const failures = ref<string[]>([]);

const kindOf = (id: string) => dir.therapists.find(t => t.id === id)?.defaultKind ?? 'fija';
const svcName = (id: string) => props.services.find(s => s.id === id)?.name ?? 'Servicio';
const existsFor = (s: TableSetup) => list.list.some(c => c.serviceId === s.serviceId && c.year === s.year && c.month === s.month);

/** Qué impide importar cada tabla marcada; una tabla marcada antes reserva su servicio y mes para las siguientes. */
const problems = computed(() => {
  const out: Record<string, string | null> = {}, taken = new Set<string>();
  for (const t of preview.value?.tables ?? []) {
    const s = setups[t.id];
    if (!s?.include) continue;
    out[t.id] = problemOf(t, s, existsFor(s), taken);
    if (!out[t.id]) taken.add(`${s.serviceId}|${s.year}|${s.month}`);
  }
  return out;
});
const chosen = computed(() => (preview.value?.tables ?? []).filter(t => setups[t.id]?.include));
const canImport = computed(() => chosen.value.length > 0 && chosen.value.every(t => !problems.value[t.id]) && !busy.value);

/** Directorio para elegir: primero las del servicio de la tabla. */
const poolFor = (s: TableSetup) => dir.therapists.filter(t => t.active)
  .sort((a, b) => Number(b.serviceIds.includes(s.serviceId)) - Number(a.serviceIds.includes(s.serviceId)) || a.name.localeCompare(b.name));
const daysOff = (t: ImportTableDTO, s: TableSetup) => (t.days !== daysIn(s.year, s.month) ? daysIn(s.year, s.month) : 0);
const when = (t: ImportTableDTO) => (t.year !== null && t.month !== null ? `${MESES[t.month]} ${t.year}` : 'mes sin detectar');

function pickPerson(s: TableSetup, row: number, id: string) { s.mapping[row] = id; if (id) s.kinds[row] = kindOf(id); }
function setHours(s: TableSetup, row: number, e: Event) {
  const v = (e.target as HTMLInputElement).value.trim();
  s.hours[row] = v === '' ? null : Number(v);
}

async function read() {
  if (!file.value) return;
  busy.value = true; error.value = '';
  try {
    const p = await upload<ImportPreviewDTO>('/schedules/import/preview', file.value);
    for (const k of Object.keys(setups)) delete setups[k];
    Object.assign(setups, initialSetups(p.tables, kindOf, props.services[0].id));
    preview.value = p;
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}

async function create() {
  busy.value = true; error.value = ''; failures.value = [];
  try {
    const tables = chosen.value;
    const r = await post<ImportBatchResultDTO>('/schedules/import/batch', {
      tables: tables.map(t => ({ serviceId: setups[t.id].serviceId, year: setups[t.id].year, month: setups[t.id].month, members: membersOf(t, setups[t.id]) }))
    });
    await list.load();
    const done = r.results.filter(x => x.schedule), bad = r.results.filter(x => x.error);
    if (bad.length) {
      failures.value = bad.map(x => `${tables[x.index].sheet} · ${when(tables[x.index])}: ${x.error!.message}`);
      for (const x of done) setups[tables[x.index].id].include = false; // lo creado no se reenvía
      toast(`${done.length} cuadro(s) importado(s); ${bad.length} con problemas.`);
      return;
    }
    const warn = done.reduce((a, x) => a + x.warnings.length, 0);
    emit('close');
    if (done.length === 1) await router.push({ name: 'editor', params: { id: done[0].schedule!.id } });
    toast(`${done.length} cuadro(s) importado(s).${warn ? ` ${warn} casilla(s) no se entendieron y quedaron libres.` : ' Revisa las alertas.'}`);
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog title="Importar cuadros" :sub="preview ? 'Marca las tablas que quieres importar y revisa a quién corresponde cada nombre.' : 'Sube el cuadro del hospital en Excel (.xlsx) u ODS (.ods). Antes de crear nada verás cómo se leyó cada tabla.'" @close="emit('close')">
    <form v-if="!preview" novalidate @submit.prevent="read">
      <div class="fld"><label for="i-f">Archivo</label><input id="i-f" type="file" accept=".xlsx,.ods,application/vnd.oasis.opendocument.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null"></div>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact"><button type="button" class="btn" @click="emit('close')">Cancelar</button><button type="submit" class="btn primary" :disabled="!file || busy">Leer archivo</button></div>
    </form>

    <form v-else novalidate @submit.prevent="create">
      <div style="max-height:62vh;overflow:auto;display:flex;flex-direction:column;gap:8px;padding-right:2px">
        <details v-for="t in preview.tables" :key="t.id" :open="setups[t.id].include" style="border:1px solid var(--line, #d9dde3);border-radius:10px;padding:8px 10px">
          <summary style="cursor:pointer;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input type="checkbox" v-model="setups[t.id].include" :aria-label="'Importar ' + t.sheet + ' ' + when(t)" @click.stop>
            <b>{{ t.sheet }}</b><span class="note" style="margin:0">{{ when(t) }} · {{ t.people.length }} personas · fila {{ t.headerRow }}</span>
          </summary>
          <p class="note" style="margin:4px 0 8px">{{ t.title }}</p>
          <template v-if="setups[t.id].include">
            <div class="fld"><label :for="'i-s' + t.id">Servicio</label>
              <select :id="'i-s' + t.id" v-model="setups[t.id].serviceId"><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
            <div class="two2">
              <div class="fld"><label :for="'i-m' + t.id">Mes</label><select :id="'i-m' + t.id" v-model.number="setups[t.id].month"><option v-for="(m, i) in MESES" :key="m" :value="i">{{ m }}</option></select></div>
              <div class="fld"><label :for="'i-y' + t.id">Año</label><input :id="'i-y' + t.id" type="number" min="2024" max="2100" v-model.number="setups[t.id].year"></div>
            </div>
            <p class="note" style="margin:-4px 0 8px" v-if="daysOff(t, setups[t.id])">El archivo trae {{ t.days }} días y {{ MESES[setups[t.id].month].toLowerCase() }} tiene {{ daysOff(t, setups[t.id]) }}: los que sobren se ignoran y los que falten quedan libres.</p>
            <div class="fld"><span>Personas del archivo · tipo en este cuadro · meta de horas del mes</span>
              <div style="display:flex;flex-direction:column;gap:10px">
                <div v-for="p in t.people" :key="p.row">
                  <label :for="'i-p' + t.id + '-' + p.row" style="text-transform:none;letter-spacing:0;font-weight:600">{{ p.name }}</label>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <select :id="'i-p' + t.id + '-' + p.row" style="flex:2 1 180px" :value="setups[t.id].mapping[p.row]" @change="pickPerson(setups[t.id], p.row, ($event.target as HTMLSelectElement).value)">
                      <option value="">No importar</option>
                      <option v-for="d in poolFor(setups[t.id])" :key="d.id" :value="d.id">{{ d.name }}{{ d.serviceIds.includes(setups[t.id].serviceId) ? '' : ' (otro servicio)' }}</option>
                    </select>
                    <select style="flex:1 1 90px" :disabled="!setups[t.id].mapping[p.row]" v-model="setups[t.id].kinds[p.row]" :aria-label="'Tipo de ' + p.name"><option value="fija">Planta</option><option value="apoyo">Apoyo</option></select>
                    <input style="flex:1 1 90px" type="number" min="0" max="744" step="1" placeholder="Horas" :disabled="!setups[t.id].mapping[p.row]" :value="setups[t.id].hours[p.row] ?? ''" :aria-label="'Meta de horas de ' + p.name" @input="setHours(setups[t.id], p.row, $event)">
                  </div>
                  <details v-if="p.warnings.length && setups[t.id].mapping[p.row]" class="note" style="margin:2px 0 0"><summary>{{ p.warnings.length }} casilla(s) sin entender (quedan libres)</summary><div v-for="w in p.warnings" :key="w">{{ w }}</div></details>
                </div>
              </div></div>
            <p class="note" style="margin:0 0 4px">Se importan {{ summarize(t, setups[t.id].mapping).selected }} de {{ t.people.length }} personas en {{ svcName(setups[t.id].serviceId) }}. Lo que traiga turno o ausencia queda fijado a mano.</p>
            <p class="err-box" v-if="problems[t.id]">{{ problems[t.id] }}</p>
          </template>
        </details>
      </div>
      <p class="note" style="margin:8px 0">Planta y Apoyo se eligen por cada cuadro; la meta de horas viene del total del archivo y se puede cambiar o dejar vacía (se reparte sola).</p>
      <p class="err-box" v-if="!chosen.length">Marca al menos una tabla para importar.</p>
      <div class="err-box" v-if="failures.length" role="alert"><div v-for="f in failures" :key="f">{{ f }}</div></div>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact"><button type="button" class="btn" @click="preview = null; error = ''; failures = []">Elegir otro archivo</button><button type="submit" class="btn primary" :disabled="!canImport">Importar {{ chosen.length }} cuadro{{ chosen.length === 1 ? '' : 's' }}</button></div>
    </form>
  </ModalDialog>
</template>
