<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ServiceDTO, UserDTO } from '@/shared';
import PageHead from '@/components/PageHead.vue';
import PendingRequests from '@/components/PendingRequests.vue';
import ServiceFormDialog from '@/components/ServiceFormDialog.vue';
import UserFormDialog from '@/components/UserFormDialog.vue';
import { errorText, post } from '@/lib/api';
import { initials } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useDirectory } from '@/stores/directory';

const dir = useDirectory();
const { t } = useI18n();
const newService = ref(''), busy = ref(false);
const svcDialog = ref<ServiceDTO | null>(null);
const userDialog = ref<{ user: UserDTO | null } | null>(null);
const pending = computed(() => dir.users.filter(u => u.status === 'pendiente'));

const reload = () => Promise.all([dir.loadServices(), dir.loadUsers()]).catch(e => toast(errorText(e)));
onMounted(reload);

const svcNames = (u: UserDTO) => u.serviceIds.map(id => dir.service(id)?.name).filter(Boolean).join(', ') || t('admin.noServices');

async function addService() {
  const n = newService.value.trim();
  if (n.length < 3) return toast(t('admin.enterServiceName'));
  busy.value = true;
  try { await post('/services', { name: n }); newService.value = ''; toast(t('admin.serviceCreated')); await dir.loadServices(); }
  catch (e) { toast(errorText(e)); } finally { busy.value = false; }
}
async function done() { svcDialog.value = null; userDialog.value = null; await reload(); }
</script>

<template>
  <main>
    <PageHead :title="t('admin.title')" :subtitle="t('admin.sub')" />
    <PendingRequests :pending="pending" @review="u => userDialog = { user: u }" />
    <div class="lsub">
      <div class="panel"><h3>{{ t('admin.services') }}</h3>
        <div>
          <div class="urow" v-for="s in dir.services" :key="s.id" style="cursor:pointer" @click="svcDialog = s">
            <span class="svdot" :style="{ background: s.color, width: '14px', height: '14px' }"></span>
            <div class="t">{{ s.name }}<small>{{ t('admin.serviceCounts', { schedules: s.scheduleCount, therapists: s.therapistCount }) }}</small></div>
            <button class="btn sm">{{ t('admin.edit') }}</button>
          </div>
        </div>
        <form class="add" style="margin-top:12px" @submit.prevent="addService">
          <input v-model="newService" :placeholder="t('admin.serviceName')" :aria-label="t('admin.serviceName')"><button class="btn sm primary" type="submit" :disabled="busy">{{ t('admin.add') }}</button>
        </form>
      </div>
      <div class="panel"><h3>{{ t('admin.users') }}</h3>
        <div>
          <div class="urow" v-for="u in dir.users" :key="u.id" style="cursor:pointer" @click="userDialog = { user: u }">
            <span class="av">{{ initials(u.name) }}</span>
            <div class="t">{{ u.name }} <span class="rolepill" :class="{ co: u.role !== 'admin' }">{{ u.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleCoord') }}</span><template v-if="u.status !== 'activo'"> <span class="st-pill bor">{{ t('admin.pending') }}</span></template>
              <small>{{ u.email }} · {{ u.role === 'admin' ? t('admin.allServices') : svcNames(u) }}</small></div>
            <button class="btn sm">{{ t('admin.edit') }}</button>
          </div>
        </div>
        <button class="btn sm" style="margin-top:12px" @click="userDialog = { user: null }">{{ t('admin.createUser') }}</button>
      </div>
    </div>
    <ServiceFormDialog v-if="svcDialog" :service="svcDialog" @close="svcDialog = null" @saved="done" />
    <UserFormDialog v-if="userDialog" :user="userDialog.user" @close="userDialog = null" @saved="done" />
  </main>
</template>
