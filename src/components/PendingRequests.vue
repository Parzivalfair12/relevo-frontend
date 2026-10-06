<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { UserDTO } from '@/shared';

defineProps<{ pending: UserDTO[] }>();
const { t } = useI18n();
defineEmits<{ review: [u: UserDTO] }>();
</script>
<template>
  <div class="banner" v-if="pending.length">
    <b>{{ t('admin.pendingRequests', { n: pending.length }) }}</b>
    <template v-for="(u, i) in pending" :key="u.id">{{ i ? ' · ' : ' ' }}{{ u.name }} ({{ u.email }}) <button class="link" @click="$emit('review', u)">{{ t('admin.review') }}</button></template>
  </div>
</template>
