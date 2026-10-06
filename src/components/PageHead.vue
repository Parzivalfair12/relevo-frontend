<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>
<template>
  <div class="pagehead">
    <div><h1>{{ title }}</h1><p v-if="subtitle">{{ subtitle }}</p></div>
    <div class="sp" v-if="$slots.default"></div>
    <slot />
  </div>
</template>
