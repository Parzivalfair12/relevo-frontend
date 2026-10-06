<script setup lang="ts">
defineProps<{ code: string; label?: string }>();
</script>
<template><i class="chip" :class="'c-' + code">{{ label ?? code }}</i></template>
