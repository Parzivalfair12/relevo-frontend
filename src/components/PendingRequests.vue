<script setup lang="ts">
import type { UserDTO } from '@/shared';

defineProps<{ pending: UserDTO[] }>();
defineEmits<{ review: [u: UserDTO] }>();
</script>
<template>
  <div class="banner" v-if="pending.length">
    <b>{{ pending.length }} solicitud(es) de acceso pendientes.</b>
    <template v-for="(u, i) in pending" :key="u.id">{{ i ? ' · ' : ' ' }}{{ u.name }} ({{ u.email }}) <button class="link" @click="$emit('review', u)">Revisar y aprobar</button></template>
  </div>
</template>
