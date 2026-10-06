<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Issue } from '@/engine';
import { tm } from '@/i18n';
import { useEditor } from '@/stores/editor';

defineEmits<{ goto: [i: Issue] }>();
const { t } = useI18n();
const ed = useEditor();
const list = computed(() => ed.issues.slice().sort((a, b) => (a.sev === b.sev ? a.day - b.day : a.sev === 'err' ? -1 : 1)));
</script>
<template>
  <div class="panel"><h3>{{ t('editor.alerts.title') }} <span style="color:var(--muted);font-weight:500">{{ list.length ? '(' + list.length + ')' : '' }}</span></h3>
    <div class="alerts">
      <button class="al" v-for="(i, k) in list" :key="k" :class="i.sev" @click="$emit('goto', i)"><i></i><span>{{ tm(i.msg) }}</span></button>
      <div class="okbox" v-if="!list.length">{{ t('editor.alerts.ok') }}</div>
    </div>
  </div>
</template>
