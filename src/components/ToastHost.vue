<script setup lang="ts">
import { toasts } from '@/lib/toast';
</script>
<template>
  <div class="toast" v-for="t in toasts" :key="t.id" role="status">{{ t.text }}</div>
</template>
