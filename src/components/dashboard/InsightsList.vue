<script setup lang="ts">
import type { DashboardInsight } from '@/shared';
import { tm } from '@/i18n';

defineProps<{ items: DashboardInsight[] }>();
</script>
<template>
  <div class="ins" style="margin-bottom:16px">
    <div class="insc" v-for="(i, k) in items" :key="k" :class="i.tone"><i>{{ i.icon }}</i><span><b>{{ tm(i.title) }}</b> {{ tm(i.text) }}</span></div>
  </div>
</template>
