<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MIN_PASSWORD } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { errorText, post, setAccessToken } from '@/lib/api';
import { toast } from '@/lib/toast';

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const f = reactive({ current: '', next: '', again: '' });
const error = ref(''), busy = ref(false);
const mismatch = computed(() => f.again !== '' && f.again !== f.next);

async function save() {
  error.value = '';
  if (!f.current) return void (error.value = t('dialogs.password.needCurrent'));
  if (f.next.length < MIN_PASSWORD) return void (error.value = t('dialogs.user.minPassword', { n: MIN_PASSWORD }));
  if (f.next === f.current) return void (error.value = t('dialogs.password.same'));
  if (f.next !== f.again) return void (error.value = t('dialogs.password.mismatch'));
  busy.value = true;
  try {
    const r = await post<{ accessToken: string }>('/auth/password', { currentPassword: f.current, newPassword: f.next });
    setAccessToken(r.accessToken); // las demás sesiones se cierran; esta sigue con el token nuevo
    toast(t('dialogs.password.done'));
    emit('close');
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog :title="t('dialogs.password.title')" :sub="t('dialogs.password.sub')" @close="emit('close')">
    <form novalidate @submit.prevent="save">
      <div class="fld"><label for="pw-c">{{ t('dialogs.password.current') }}</label><input id="pw-c" type="password" v-model="f.current" autocomplete="current-password"></div>
      <div class="fld"><label for="pw-n">{{ t('dialogs.password.next') }}</label><input id="pw-n" type="password" v-model="f.next" autocomplete="new-password" :placeholder="t('dialogs.user.passwordHint', { n: MIN_PASSWORD })"></div>
      <div class="fld"><label for="pw-a">{{ t('dialogs.password.again') }}</label><input id="pw-a" type="password" v-model="f.again" autocomplete="new-password" :aria-invalid="mismatch"></div>
      <p class="note" style="margin:0 0 8px" v-if="mismatch" role="status">{{ t('dialogs.password.mismatch') }}</p>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact"><button type="button" class="btn" @click="emit('close')">{{ t('common.cancel') }}</button><button type="submit" class="btn primary" :disabled="busy">{{ t('dialogs.password.save') }}</button></div>
    </form>
  </ModalDialog>
</template>
