<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { MIN_PASSWORD, type Role, type UserDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { del, errorText, patch, post } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuth } from '@/stores/auth';
import { useDirectory } from '@/stores/directory';

/** user = null → crear. Un usuario pendiente se aprueba desde aquí. */
const props = defineProps<{ user: UserDTO | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const dir = useDirectory(), auth = useAuth();

const id = props.user?.id ?? null;
const pend = props.user?.status === 'pendiente', self = !!id && auth.user?.id === id;
const u = reactive({ name: props.user?.name ?? '', email: props.user?.email ?? '', password: '', role: (props.user?.role ?? 'coord') as Role, serviceIds: [...(props.user?.serviceIds ?? [])] });
const error = ref(''), busy = ref(false);
const title = computed(() => (pend ? 'Aprobar solicitud' : id ? 'Editar usuario' : 'Crear usuario'));
const sub = computed(() => (pend ? 'Asigna los servicios que podrá gestionar y aprueba el acceso.' : 'Define el rol y los servicios a los que tiene acceso.'));

function toggleService(s: string) { u.serviceIds = u.serviceIds.includes(s) ? u.serviceIds.filter(x => x !== s) : u.serviceIds.concat(s); }

async function save() {
  error.value = '';
  const name = u.name.trim(), email = u.email.trim().toLowerCase();
  if (name.length < 3) return void (error.value = 'Escribe el nombre.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return void (error.value = 'Escribe un correo válido.');
  if (u.role === 'coord' && !u.serviceIds.length) return void (error.value = 'Asigna al menos un servicio.');
  if (!id && u.password.length < MIN_PASSWORD) return void (error.value = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  busy.value = true;
  try {
    const body = { name, email, role: u.role, serviceIds: u.role === 'admin' ? [] : u.serviceIds };
    if (!id) await post('/users', { ...body, password: u.password });
    else if (pend) await post(`/users/${id}/approve`, body);
    else await patch(`/users/${id}`, body);
    toast(pend ? 'Acceso aprobado' : id ? 'Usuario actualizado' : 'Usuario creado');
    emit('saved');
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
async function remove() {
  busy.value = true;
  try { await del(`/users/${id}`); toast('Usuario eliminado'); emit('saved'); }
  catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog :title="title" :sub="sub" @close="emit('close')">
    <form novalidate @submit.prevent="save">
      <div class="fld"><label for="u-n">Nombre</label><input id="u-n" v-model="u.name"></div>
      <div class="fld"><label for="u-e">Correo</label><input id="u-e" type="email" v-model="u.email"></div>
      <div class="fld" v-if="!id"><label for="u-p">Contraseña inicial</label><input id="u-p" type="text" v-model="u.password" autocomplete="off" :placeholder="`Mínimo ${MIN_PASSWORD} caracteres`"></div>
      <div class="fld"><span>Rol</span>
        <div class="seg">
          <button type="button" :aria-pressed="u.role === 'coord'" :disabled="self" @click="u.role = 'coord'">Coordinadora</button>
          <button type="button" :aria-pressed="u.role === 'admin'" :disabled="self" @click="u.role = 'admin'">Administrador</button>
        </div></div>
      <div class="fld" v-show="u.role !== 'admin'"><span>Servicios que gestiona</span>
        <div class="chips">
          <button v-for="s in dir.services" :key="s.id" type="button" class="cx" :aria-pressed="u.serviceIds.includes(s.id)" @click="toggleService(s.id)">
            <span class="svdot" :style="{ background: s.color, marginRight: '5px' }"></span>{{ s.name }}
          </button>
        </div></div>
      <p class="err-box" v-if="error" role="alert">{{ error }}</p>
      <div class="mact">
        <button v-if="id && !self" type="button" class="btn danger" :disabled="busy" @click="remove">Eliminar</button>
        <button type="button" class="btn" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn primary" :disabled="busy">{{ pend ? 'Aprobar y guardar' : 'Guardar' }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
