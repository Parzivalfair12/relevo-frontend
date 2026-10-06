<script setup lang="ts">
import { onMounted, ref } from 'vue';

/** Ventana flotante junto a un elemento: debajo si cabe y, si no, encima (misma regla que el mockup). */
const props = defineProps<{ anchor: DOMRect; width: number; extra?: string }>();
const el = ref<HTMLElement>();
const pos = ref<{ left: string; top: string; visibility: 'hidden' | 'visible' }>({ left: '0px', top: '0px', visibility: 'hidden' });
onMounted(() => {
  const mh = el.value?.offsetHeight ?? 0, r = props.anchor;
  pos.value = {
    left: Math.max(8, Math.min(innerWidth - props.width - 8, r.left - 80)) + 'px',
    top: (r.bottom + mh + 8 > innerHeight ? Math.max(8, r.top - mh - 6) : r.bottom + 6) + 'px',
    visibility: 'visible'
  };
});
</script>
<template>
  <Teleport to="body"><div ref="el" class="menu" :class="extra" :style="{ ...pos, width: width + 'px' }"><slot /></div></Teleport>
</template>
