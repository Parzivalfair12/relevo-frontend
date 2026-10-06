<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{ title: string; sub?: string }>();
const emit = defineEmits<{ close: [] }>();
const box = ref<HTMLElement>();
let opener: Element | null = null;

const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close'); };
onMounted(() => {
  opener = document.activeElement;
  window.addEventListener('keydown', onKey);
  // Foco al primer campo; si no hay (vista de solo lectura), al primer botón
  (box.value?.querySelector<HTMLElement>('input:not([disabled]),select:not([disabled])') ?? box.value?.querySelector<HTMLElement>('button'))?.focus();
});
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); (opener as HTMLElement | null)?.focus?.(); });
</script>
<template>
  <Teleport to="body">
    <div class="ov">
      <div class="mod" role="dialog" aria-modal="true" aria-labelledby="mod-title" ref="box">
        <h2 id="mod-title">{{ title }}</h2>
        <p class="sub" v-if="sub">{{ sub }}</p>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style>
/* Los campos van dentro de un <form> (Enter envía); en el mockup eran hijos directos del modal, sin el margen por defecto del form */
.mod form { margin: 0; }
</style>
