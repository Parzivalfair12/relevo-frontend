<script setup lang="ts">
import type { DashboardInsight } from '@/shared';

defineProps<{ items: DashboardInsight[] }>();
</script>
<template>
  <div class="ins" style="margin-bottom:16px">
    <div class="insc" v-for="(i, k) in items" :key="k" :class="i.tone"><i>{{ i.icon }}</i><span><b>{{ i.title }}</b> {{ i.text }}</span></div>
  </div>
</template>
