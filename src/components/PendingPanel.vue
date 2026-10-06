<script setup lang="ts">
defineProps<{ phase: string; mockup: string; items: string[] }>();
</script>
<template>
  <div class="panel">
    <h3>Pendiente de construir · {{ phase }}</h3>
    <p class="note" style="margin:0 0 10px">Reproducir tal cual el bloque <code>{{ mockup }}</code> de <code>referencia/mockup-referencia.html</code> (captura en <code>referencia/capturas/</code>). Componentes previstos:</p>
    <ul style="margin:0;padding-left:20px"><li v-for="i in items" :key="i">{{ i }}</li></ul>
  </div>
</template>
