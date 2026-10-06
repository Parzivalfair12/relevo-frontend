<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEditor } from '@/stores/editor';

defineEmits<{ step: [k: number] }>();
const { t } = useI18n();
const ed = useEditor();
const steps = computed(() => (['team', 'absences', 'generate', 'adjust'] as const).map(k => [t(`editor.steps.${k}`), t(`editor.steps.${k}Sub`)]));
</script>
<template>
  <nav class="steps" :aria-label="t('editor.steps.aria')">
    <button class="stp" v-for="([t, sub], i) in steps" :key="i" :class="{ on: i + 1 <= ed.step }" @click="$emit('step', i + 1)"><i>{{ i + 1 }}</i><span><b>{{ t }}</b><small>{{ sub }}</small></span></button>
  </nav>
</template>
