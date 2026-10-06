<script setup lang="ts">
import { useEditor } from '@/stores/editor';

defineEmits<{ step: [k: number] }>();
const ed = useEditor();
const steps = [
  ['Revisa el equipo', 'Planta y apoyo'],
  ['Registra ausencias', 'Permisos, licencias, incapacidades'],
  ['Genera el cuadro', 'Un clic y queda armado'],
  ['Ajusta y copia', 'Pinta turnos y pega en Excel']
];
</script>
<template>
  <nav class="steps" aria-label="Paso a paso">
    <button class="stp" v-for="([t, sub], i) in steps" :key="i" :class="{ on: i + 1 <= ed.step }" @click="$emit('step', i + 1)"><i>{{ i + 1 }}</i><span><b>{{ t }}</b><small>{{ sub }}</small></span></button>
  </nav>
</template>
