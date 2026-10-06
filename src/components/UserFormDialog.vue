<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MIN_PASSWORD, type Role, type UserDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { del, errorText, patch, post } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuth } from '@/stores/auth';
import { useDirectory } from '@/stores/directory';

/** user = null → crear. Un usuario pendiente se aprueba desde aquí. */
const props = defineProps<{ user: UserDTO | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const { t } = useI18n();
const dir = useDirectory(), auth = useAuth();

const id = props.user?.id ?? null;
const pend = props.user?.status === 'pendiente', self = !!id && auth.user?.id === id;
const u = reactive({ name: props.user?.name ?? '', email: props.user?.email ?? '', password: '', role: (props.user?.role ?? 'coord') as Role, serviceIds: [...(props.user?.serviceIds ?? [])] });
const error = ref(''), busy = ref(false);
const title = computed(() => (pend ? t('dialogs.user.titleApprove') : id ? t('dialogs.user.titleEdit') : t('dialogs.user.titleNew')));
const sub = computed(() => (pend ? t('dialogs.user.subApprove') : t('dialogs.user.sub')));

function toggleService(s: string) { u.serviceIds = u.serviceIds.includes(s) ? u.serviceIds.filter(x => x !== s) : u.serviceIds.concat(s); }

async function save() {
  error.value = '';
  const name = u.name.trim(), email = u.email.trim().toLowerCase();
  if (name.length < 3) return void (error.value = t('dialogs.user.needName'));
  if (!/^\S+@\S+\.\S+$/.test(email)) return void (error.value = t('dialogs.user.needEmail'));
  if (u.role === 'coord' && !u.serviceIds.length) return void (error.value = t('dialogs.user.needService'));
  if (!id && u.password.length < MIN_PASSWORD) return void (error.value = t('dialogs.user.minPassword', { n: MIN_PASSWORD }));
  busy.value = true;
  try {
    const body = { name, email, role: u.role, serviceIds: u.role === 'admin' ? [] : u.serviceIds };
    if (!id) await post('/users', { ...body, password: u.password });
    else if (pend) await post(`/users/${id}/approve`, body);
    else await patch(`/users/${id}`, body);
    toast(pend ? t('dialogs.user.approved') : id ? t('dialogs.user.updated') : t('dialogs.user.created'));
    emit('saved');
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
async function remove() {
  busy.value = true;
  try { await del(`/users/${id}`); toast(t('dialogs.user.deleted')); emit('saved'); }
  catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog :title="title" :sub="sub" @close="emit('close')">
    <form novalidate @submit.prevent="save">
      <div class="fld"><label for="u-n">{{ t('dialogs.user.name') }}</label><input id="u-n" v-model="u.name"></div>
      <div class="fld"><label for="u-e">{{ t('dialogs.user.email') }}</label><input id="u-e" type="email" v-model="u.email"></div>
      <div class="fld" v-if="!id"><label for="u-p">{{ t('dialogs.user.initialPassword') }}</label><input id="u-p" type="text" v-model="u.password" autocomplete="off" :placeholder="t('dialogs.user.passwordHint', { n: MIN_PASSWORD })"></div>
      <div class="fld"><span>{{ t('dialogs.user.role') }}</span>
        <div class="seg">
          <button type="button" :aria-pressed="u.role === 'coord'" :disabled="self" @click="u.role = 'coord'">{{ t('dialogs.user.coord') }}</button>
          <button type="button" :aria-pressed="u.role === 'admin'" :disabled="self" @click="u.role = 'admin'">{{ t('dialogs.user.admin') }}</button>
        </div></div>
      <div class="fld" v-show="u.role !== 'admin'"><span>{{ t('dialogs.user.services') }}</span>
        <div class="chips">
          <button v-for="s in dir.services" :key="s.id" type="button" class="cx" :aria-pressed="u.serviceIds.includes(s.id)" @click="toggleService(s.id)">
            <span class="svdot" :style="{ background: s.color, marginRight: '5px' }"></span>{{ s.name }}
          </button>
        </div></div>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact">
        <button v-if="id && !self" type="button" class="btn danger" :disabled="busy" @click="remove">{{ t('common.delete') }}</button>
        <button type="button" class="btn" @click="emit('close')">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn primary" :disabled="busy">{{ pend ? t('dialogs.user.approveSave') : t('common.save') }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
