<script setup lang="ts">
/** Logo de Relevo: un anillo mitad día y mitad noche (los turnos) con una onda de respiración al centro. */
defineProps<{ word?: boolean }>();
</script>

<template>
  <span class="brand-lock">
    <svg class="brand-mark" viewBox="0 0 48 48" role="img" aria-label="Relevo">
      <rect width="48" height="48" rx="13" fill="var(--accent)" />
      <g transform="rotate(-25 24 24)" fill="none" stroke-width="4.6" stroke-linecap="round">
        <path d="M11 24a13 13 0 0 1 26 0" stroke="#FFD9A8" />
        <path d="M37 24a13 13 0 0 1-26 0" stroke="#fff" />
      </g>
      <path d="M15.5 24c2.4-5.5 5-5.5 8.5 0s6.1 5.5 8.5 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span v-if="word" class="brand-word">relevo</span>
  </span>
</template>

<style scoped>
.brand-lock { display: inline-flex; align-items: center; gap: 10px; }
.brand-mark { width: 34px; height: 34px; flex: none; }
.brand-word { font-family: var(--display); font-weight: 700; font-size: 22px; letter-spacing: -0.03em; line-height: 1; }
</style>
