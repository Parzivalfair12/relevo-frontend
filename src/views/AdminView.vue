<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
const newService = ref(''), busy = ref(false);
const svcDialog = ref<ServiceDTO | null>(null);
const userDialog = ref<{ user: UserDTO | null } | null>(null);
const pending = computed(() => dir.users.filter(u => u.status === 'pendiente'));

const reload = () => Promise.all([dir.loadServices(), dir.loadUsers()]).catch(e => toast(errorText(e)));
onMounted(reload);

const svcNames = (u: UserDTO) => u.serviceIds.map(id => dir.service(id)?.name).filter(Boolean).join(', ') || 'Sin servicios';

async function addService() {
  const n = newService.value.trim();
  if (n.length < 3) return toast('Escribe el nombre del servicio');
  busy.value = true;
  try { await post('/services', { name: n }); newService.value = ''; toast('Servicio creado'); await dir.loadServices(); }
  catch (e) { toast(errorText(e)); } finally { busy.value = false; }
}
async function done() { svcDialog.value = null; userDialog.value = null; await reload(); }
</script>

<template>
  <main>
    <PageHead title="Administración" subtitle="Servicios, usuarios y permisos de acceso a los cuadros." />
    <PendingRequests :pending="pending" @review="u => userDialog = { user: u }" />
    <div class="lsub">
      <div class="panel"><h3>Servicios</h3>
        <div>
          <div class="urow" v-for="s in dir.services" :key="s.id" style="cursor:pointer" @click="svcDialog = s">
            <span class="svdot" :style="{ background: s.color, width: '14px', height: '14px' }"></span>
            <div class="t">{{ s.name }}<small>{{ s.scheduleCount }} cuadros · {{ s.therapistCount }} terapeutas</small></div>
            <button class="btn sm">Editar</button>
          </div>
        </div>
        <form class="add" style="margin-top:12px" @submit.prevent="addService">
          <input v-model="newService" placeholder="Nombre del servicio" aria-label="Nombre del servicio"><button class="btn sm primary" type="submit" :disabled="busy">Agregar</button>
        </form>
      </div>
      <div class="panel"><h3>Usuarios</h3>
        <div>
          <div class="urow" v-for="u in dir.users" :key="u.id" style="cursor:pointer" @click="userDialog = { user: u }">
            <span class="av">{{ initials(u.name) }}</span>
            <div class="t">{{ u.name }} <span class="rolepill" :class="{ co: u.role !== 'admin' }">{{ u.role === 'admin' ? 'Admin' : 'Coordinadora' }}</span><template v-if="u.status !== 'activo'"> <span class="st-pill bor">Pendiente</span></template>
              <small>{{ u.email }} · {{ u.role === 'admin' ? 'Todos los servicios' : svcNames(u) }}</small></div>
            <button class="btn sm">Editar</button>
          </div>
        </div>
        <button class="btn sm" style="margin-top:12px" @click="userDialog = { user: null }">＋ Crear usuario</button>
      </div>
    </div>
    <ServiceFormDialog v-if="svcDialog" :service="svcDialog" @close="svcDialog = null" @saved="done" />
    <UserFormDialog v-if="userDialog" :user="userDialog.user" @close="userDialog = null" @saved="done" />
  </main>
</template>
