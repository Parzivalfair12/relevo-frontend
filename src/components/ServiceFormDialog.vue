<script setup lang="ts">
import { ref } from 'vue';
import { SERVICE_COLORS, type ServiceDTO } from '@/shared';
import ModalDialog from '@/components/ModalDialog.vue';
import { del, errorText, patch } from '@/lib/api';
import { toast } from '@/lib/toast';

const props = defineProps<{ service: ServiceDTO }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const name = ref(props.service.name), color = ref(props.service.color), busy = ref(false);
const nq = props.service.scheduleCount ?? 0;

async function save() {
  if (name.value.trim().length < 3) return toast('Escribe el nombre');
  busy.value = true;
  try { await patch(`/services/${props.service.id}`, { name: name.value.trim(), color: color.value }); toast('Servicio actualizado'); emit('saved'); }
  catch (e) { toast(errorText(e)); } finally { busy.value = false; }
}
async function remove() {
  busy.value = true;
  try { await del(`/services/${props.service.id}`); toast('Servicio eliminado'); emit('saved'); }
  catch (e) { toast(errorText(e)); } finally { busy.value = false; }
}
</script>

<template>
  <ModalDialog title="Editar servicio" :sub="`${nq} cuadro(s) en este servicio.`" @close="emit('close')">
    <form novalidate @submit.prevent="save">
      <div class="fld"><label for="s-n">Nombre</label><input id="s-n" v-model="name"></div>
      <div class="fld"><span>Color</span>
        <div class="chips">
          <button v-for="c in SERVICE_COLORS" :key="c" type="button" class="swatch" :style="{ background: c }" :aria-pressed="c.toLowerCase() === color.toLowerCase()" :aria-label="`Color ${c}`" @click="color = c"></button>
        </div></div>
      <div class="mact">
        <button v-if="!nq" type="button" class="btn danger" :disabled="busy" @click="remove">Eliminar</button>
        <button type="button" class="btn" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn primary" :disabled="busy">Guardar</button>
      </div>
    </form>
  </ModalDialog>
</template>
