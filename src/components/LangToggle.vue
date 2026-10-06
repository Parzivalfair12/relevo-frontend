<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { lang, setLang } from '@/i18n';

const { t } = useI18n();
</script>

<template>
  <button type="button" class="icon-btn lang-btn" :aria-label="t('common.lang.label') + ': ' + (lang === 'es' ? t('common.lang.es') : t('common.lang.en'))" :title="t('common.lang.label')" @click="setLang(lang === 'es' ? 'en' : 'es')">
    <b style="font-size:12px;letter-spacing:.04em">{{ lang === 'es' ? 'ES' : 'EN' }}</b>
  </button>
</template>
