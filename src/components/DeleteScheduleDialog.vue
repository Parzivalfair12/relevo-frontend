<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ModalDialog from '@/components/ModalDialog.vue';
import { del, errorText } from '@/lib/api';

/** Confirmación para eliminar un cuadro en borrador. El primer botón (Cancelar) toma el foco: Enter no borra por accidente. */
const props = defineProps<{ id: string; name: string }>();
const emit = defineEmits<{ close: []; deleted: [] }>();
const { t } = useI18n();
const busy = ref(false), error = ref('');

async function remove() {
  busy.value = true; error.value = '';
  try { await del(`/schedules/${props.id}`); emit('deleted'); }
  catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog :title="t('editorView.deleteTitle')" :sub="t('editorView.deleteText', { name })" @close="emit('close')">
    <p class="err-box" v-if="error" role="alert">{{ error }}</p>
    <div class="mact">
      <button type="button" class="btn" :disabled="busy" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn danger" :disabled="busy" @click="remove">{{ t('editorView.deleteConfirm') }}</button>
    </div>
  </ModalDialog>
</template>
