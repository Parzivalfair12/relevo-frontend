<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { positionLabel } from '@/i18n';
import { POSITIONS, type Kind, type TherapistDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { del, errorText, patch, post } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';

/** therapist = null → registrar; si no, editar. readonly = coordinadoras (solo consultan). */
const props = defineProps<{ therapist: TherapistDTO | null; readonly: boolean }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const { t } = useI18n();
const dir = useDirectory();

const id = props.therapist?.id ?? null, ro = props.readonly, dis = ro;
const inQ = props.therapist?.scheduleCount ?? 0;
const f = reactive({
  name: props.therapist?.name ?? '', document: props.therapist?.document ?? '',
  position: props.therapist?.position ?? POSITIONS[0] as string,
  kind: (props.therapist?.defaultKind ?? 'fija') as Kind,
  serviceIds: [...(props.therapist?.serviceIds ?? [])], active: props.therapist?.active ?? true
});
const error = ref(''), busy = ref(false);
const title = computed(() => (id ? (ro ? f.name : t('dialogs.therapist.titleEdit')) : t('dialogs.therapist.titleNew')));
const sub = computed(() => (ro ? t('dialogs.therapist.subReadonly') : t('dialogs.therapist.sub')));

function toggleService(s: string) { f.serviceIds = f.serviceIds.includes(s) ? f.serviceIds.filter(x => x !== s) : f.serviceIds.concat(s); }

async function save() {
  error.value = '';
  const name = f.name.trim();
  if (name.length < 3) return void (error.value = t('dialogs.therapist.needName'));
  if (!f.serviceIds.length) return void (error.value = t('dialogs.therapist.needService'));
  busy.value = true;
  try {
    const body = { name, document: f.document.trim(), position: f.position, defaultKind: f.kind, serviceIds: f.serviceIds, active: f.active };
    if (id) await patch(`/therapists/${id}`, body); else await post('/therapists', body);
    toast(id ? t('dialogs.therapist.saved') : t('dialogs.therapist.registered', { name }));
    emit('saved');
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
async function remove() {
  busy.value = true;
  try { await del(`/therapists/${id}`); toast(t('dialogs.therapist.deleted')); emit('saved'); }
  catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog :title="title" :sub="sub" @close="emit('close')">
    <form novalidate @submit.prevent="save">
      <div class="fld"><label for="f-n">{{ t('dialogs.therapist.fullName') }}</label><input id="f-n" v-model="f.name" :disabled="dis"></div>
      <div class="two2">
        <div class="fld"><label for="f-d">{{ t('dialogs.therapist.document') }}</label><input id="f-d" v-model="f.document" inputmode="numeric" :disabled="dis"></div>
        <div class="fld"><label for="f-c">{{ t('dialogs.therapist.position') }}</label><select id="f-c" v-model="f.position" :disabled="dis"><option v-for="c in POSITIONS" :key="c" :value="c">{{ positionLabel(c) }}</option></select></div>
      </div>
      <div class="fld"><span>{{ t('dialogs.therapist.defaultKind') }}</span>
        <div class="seg">
          <button type="button" :aria-pressed="f.kind === 'fija'" :disabled="dis" @click="f.kind = 'fija'">{{ t('dialogs.therapist.fixed') }}</button>
          <button type="button" :aria-pressed="f.kind === 'apoyo'" :disabled="dis" @click="f.kind = 'apoyo'">{{ t('dialogs.therapist.support') }}</button>
        </div></div>
      <div class="fld"><span>{{ t('dialogs.therapist.services') }}</span>
        <div class="chips">
          <button v-for="s in dir.services" :key="s.id" type="button" class="cx" :aria-pressed="f.serviceIds.includes(s.id)" :disabled="dis" @click="toggleService(s.id)">
            <span class="svdot" :style="{ background: s.color, marginRight: '5px' }"></span>{{ s.name }}
          </button>
        </div></div>
      <div class="row" style="border:0;padding:0 0 10px"><div>{{ t('dialogs.therapist.active') }}<small>{{ t('dialogs.therapist.activeHint') }}</small></div>
        <label class="sw"><input type="checkbox" v-model="f.active" :disabled="dis" :aria-label="t('dialogs.therapist.active')"><i></i></label></div>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact">
        <button v-if="id && !ro && !inQ" type="button" class="btn danger" :disabled="busy" @click="remove">{{ t('common.delete') }}</button>
        <button type="button" class="btn" @click="emit('close')">{{ ro ? t('common.close') : t('common.cancel') }}</button>
        <button v-if="!ro" type="submit" class="btn primary" :disabled="busy">{{ t('common.save') }}</button>
      </div>
      <p class="note" v-if="id && inQ && !ro">{{ t('dialogs.therapist.inSchedules', { n: inQ }) }}</p>
    </form>
  </ModalDialog>
</template>
