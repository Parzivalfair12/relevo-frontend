<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { MESES, type ImportPreviewDTO, type ImportResultDTO, type ServiceDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { errorText, post, upload } from '@/lib/api';
import { bestTable, initialMapping, membersOf, summarize, type Mapping } from '@/lib/import';
import { daysIn } from '@/lib/schedule';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';
import { useSchedules } from '@/stores/schedules';

const props = defineProps<{ services: ServiceDTO[] }>();
const emit = defineEmits<{ close: [] }>();
const router = useRouter(), dir = useDirectory(), list = useSchedules();

const svc = ref(props.services[0].id), file = ref<File | null>(null), busy = ref(false), error = ref('');
const preview = ref<ImportPreviewDTO | null>(null), tableId = ref(''), mapping = ref<Mapping>({});
const month = ref(new Date().getMonth()), year = ref(new Date().getFullYear());

const table = computed(() => preview.value?.tables.find(t => t.id === tableId.value) ?? null);
const sum = computed(() => (table.value ? summarize(table.value, mapping.value) : null));
const exists = computed(() => list.list.some(c => c.serviceId === svc.value && c.year === year.value && c.month === month.value));
const daysOff = computed(() => (table.value && table.value.days !== daysIn(year.value, month.value) ? daysIn(year.value, month.value) : 0));
/** Directorio para elegir: primero las del servicio. */
const pool = computed(() => dir.therapists.filter(t => t.active).sort((a, b) => Number(b.serviceIds.includes(svc.value)) - Number(a.serviceIds.includes(svc.value)) || a.name.localeCompare(b.name)));
const canImport = computed(() => !!sum.value && sum.value.selected >= 2 && !sum.value.duplicated && !exists.value && !busy.value);

function pickTable(id: string) {
  tableId.value = id;
  const t = preview.value!.tables.find(x => x.id === id)!;
  mapping.value = initialMapping(t);
  if (t.month !== null && t.year !== null) { month.value = t.month; year.value = t.year; }
}
async function read() {
  if (!file.value) return;
  busy.value = true; error.value = '';
  try {
    preview.value = await upload<ImportPreviewDTO>(`/schedules/import/preview?serviceId=${svc.value}`, file.value);
    pickTable(bestTable(preview.value.tables).id);
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
async function create() {
  busy.value = true; error.value = '';
  try {
    const r = await post<ImportResultDTO>('/schedules/import', { serviceId: svc.value, year: year.value, month: month.value, members: membersOf(table.value!, mapping.value) });
    emit('close');
    await router.push({ name: 'editor', params: { id: r.schedule.id } });
    toast(r.warnings.length ? `Cuadro importado. ${r.warnings.length} casilla(s) no se entendieron y quedaron libres.` : 'Cuadro importado. Revisa las alertas.');
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog title="Importar cuadro" :sub="preview ? 'Revisa cómo se leyó el archivo y a quién corresponde cada nombre.' : 'Sube el cuadro del hospital en Excel (.xlsx) u ODS (.ods). Antes de crearlo verás cómo se leyó.'" @close="emit('close')">
    <form v-if="!preview" novalidate @submit.prevent="read">
      <div class="fld"><label for="i-s">Servicio</label><select id="i-s" v-model="svc"><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
      <div class="fld"><label for="i-f">Archivo</label><input id="i-f" type="file" accept=".xlsx,.ods,application/vnd.oasis.opendocument.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null"></div>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact"><button type="button" class="btn" @click="emit('close')">Cancelar</button><button type="submit" class="btn primary" :disabled="!file || busy">Leer archivo</button></div>
    </form>

    <form v-else-if="table && sum" novalidate @submit.prevent="create">
      <div class="fld" v-if="preview.tables.length > 1"><label for="i-t">Tabla del archivo</label>
        <select id="i-t" :value="tableId" @change="pickTable(($event.target as HTMLSelectElement).value)">
          <option v-for="t in preview.tables" :key="t.id" :value="t.id">{{ t.sheet }} · fila {{ t.headerRow }} · {{ t.title }}</option>
        </select></div>
      <div class="two2">
        <div class="fld"><label for="i-m">Mes</label><select id="i-m" v-model.number="month"><option v-for="(m, i) in MESES" :key="m" :value="i">{{ m }}</option></select></div>
        <div class="fld"><label for="i-y">Año</label><input id="i-y" type="number" min="2024" max="2100" v-model.number="year"></div>
      </div>
      <p class="note" style="margin:-4px 0 8px" v-if="daysOff">El archivo trae {{ table.days }} días y {{ MESES[month].toLowerCase() }} tiene {{ daysOff }}: los que sobren se ignoran y los que falten quedan libres.</p>
      <div class="fld"><span>Personas del archivo ({{ table.people.length }})</span>
        <div style="max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:8px;padding-right:2px">
          <div v-for="p in table.people" :key="p.row">
            <label :for="'i-p' + p.row" style="text-transform:none;letter-spacing:0;font-weight:600">{{ p.name }}</label>
            <select :id="'i-p' + p.row" v-model="mapping[p.row]">
              <option value="">No importar</option>
              <option v-for="t in pool" :key="t.id" :value="t.id">{{ t.name }}{{ t.serviceIds.includes(svc) ? '' : ' (otro servicio)' }}</option>
            </select>
            <details v-if="p.warnings.length && mapping[p.row]" class="note" style="margin:2px 0 0"><summary>{{ p.warnings.length }} casilla(s) sin entender (quedan libres)</summary><div v-for="w in p.warnings" :key="w">{{ w }}</div></details>
          </div>
        </div></div>
      <p class="note" style="margin:0 0 8px">Se importan {{ sum.selected }} de {{ sum.total }} personas{{ sum.warnings ? ' · ' + sum.warnings + ' casilla(s) sin entender' : '' }}. Lo que traiga turno o ausencia queda fijado a mano.</p>
      <p class="err-box" v-if="sum.duplicated">Una persona del directorio solo puede elegirse una vez.</p>
      <p class="err-box" v-else-if="sum.selected < 2">Elige al menos 2 personas para importar.</p>
      <p class="err-box" v-else-if="exists">Ya existe un cuadro de este servicio en ese mes.</p>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact"><button type="button" class="btn" @click="preview = null; error = ''">Elegir otro archivo</button><button type="submit" class="btn primary" :disabled="!canImport">Importar cuadro</button></div>
    </form>
  </ModalDialog>
</template>
