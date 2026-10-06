<script setup lang="ts">
import { computed } from 'vue';
import type { Issue } from '@/engine';
import { useEditor } from '@/stores/editor';

defineEmits<{ goto: [i: Issue] }>();
const ed = useEditor();
const list = computed(() => ed.issues.slice().sort((a, b) => (a.sev === b.sev ? a.day - b.day : a.sev === 'err' ? -1 : 1)));
</script>
<template>
  <div class="panel"><h3>Alertas <span style="color:var(--muted);font-weight:500">{{ list.length ? '(' + list.length + ')' : '' }}</span></h3>
    <div class="alerts">
      <button class="al" v-for="(i, k) in list" :key="k" :class="i.sev" @click="$emit('goto', i)"><i></i><span>{{ i.msg }}</span></button>
      <div class="okbox" v-if="!list.length">✓ Sin alertas. El cuadro cumple todas las reglas.</div>
    </div>
  </div>
</template>
