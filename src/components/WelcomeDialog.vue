<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ModalDialog from '@/components/ModalDialog.vue';
import BrandLogo from '@/components/BrandLogo.vue';
import { useAuth } from '@/stores/auth';

const emit = defineEmits<{ close: []; go: [to: 'new' | 'import'] }>();
const { t } = useI18n();
const auth = useAuth();
const steps = [1, 2, 3, 4] as const;
</script>

<template>
  <ModalDialog :title="t('welcome.title', { name: auth.user?.name.split(' ')[0] ?? '' })" :sub="t('welcome.sub')" @close="emit('close')">
    <div class="wl-brand"><BrandLogo word /></div>
    <ol class="wl-steps">
      <li v-for="n in steps" :key="n">
        <i>{{ n }}</i>
        <span><b>{{ t(`welcome.step${n}.title`) }}</b><small>{{ t(`welcome.step${n}.text`) }}</small></span>
      </li>
    </ol>
    <p class="note wl-tip" v-if="auth.isAdmin">{{ t('welcome.adminTip') }}</p>
    <p class="note wl-tip">{{ t('welcome.reopen') }}</p>
    <div class="mact">
      <button type="button" class="btn" @click="emit('close')">{{ t('welcome.later') }}</button>
      <button type="button" class="btn" @click="emit('go', 'import')">{{ t('welcome.import') }}</button>
      <button type="button" class="btn primary" @click="emit('go', 'new')">{{ t('welcome.create') }}</button>
    </div>
  </ModalDialog>
</template>

<style scoped>
.wl-brand { margin: 4px 0 14px; }
.wl-steps { list-style: none; margin: 0 0 6px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.wl-steps li { display: flex; gap: 12px; align-items: flex-start; }
.wl-steps i { font-style: normal; font-weight: 700; flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent); font-family: var(--display); }
.wl-steps span { display: flex; flex-direction: column; min-width: 0; }
.wl-steps small { color: var(--muted); font-size: 13px; }
.wl-tip { margin: 8px 0 0; }
</style>
