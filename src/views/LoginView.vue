<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { loginSchema, registerSchema } from '@/shared';
import BrandLogo from '@/components/BrandLogo.vue';
import { useAuth } from '@/stores/auth';
import { ApiException } from '@/lib/api';

const auth = useAuth(), router = useRouter();
const signup = ref(false), showPw = ref(false), busy = ref(false);
const name = ref(''), email = ref(''), password = ref('');
const msg = ref<{ text: string; ok: boolean } | null>(null);
const demoUsers = import.meta.env.VITE_DEMO_USERS === 'true'; // solo en desarrollo
const demos = [
  { label: 'Administrador', email: 'admin@turnos.demo', password: 'admin123' },
  { label: 'Coordinadora', email: 'coordinadora@turnos.demo', password: 'coord123' }
];
const copy = computed(() => signup.value
  ? { t: 'Crea tu cuenta', s: 'Un administrador aprobará tu acceso y te asignará servicios.', go: 'Solicitar acceso', q: '¿Ya tienes cuenta?', sw: 'Inicia sesión' }
  : { t: 'Inicia sesión', s: 'Entra con tu cuenta para ver y armar tus cuadros.', go: 'Ingresar', q: '¿Aún no tienes cuenta?', sw: 'Crear cuenta' });

function setMode(su: boolean) { signup.value = su; msg.value = null; }
function fillDemo(d: (typeof demos)[number]) { setMode(false); email.value = d.email; password.value = d.password; }

async function submit() {
  msg.value = null;
  try {
    if (signup.value) {
      const r = registerSchema.safeParse({ name: name.value, email: email.value, password: password.value });
      if (!r.success) return void (msg.value = { text: r.error.issues[0].message, ok: false }); // mensajes en español del esquema compartido
      busy.value = true; await auth.register(r.data.name, r.data.email, r.data.password);
      setMode(false); password.value = '';
      msg.value = { text: 'Solicitud enviada. Cuando un administrador la apruebe podrás entrar.', ok: true };
    } else {
      const r = loginSchema.safeParse({ email: email.value, password: password.value });
      if (!r.success) return void (msg.value = { text: 'Correo o contraseña incorrectos.', ok: false });
      busy.value = true; await auth.login(r.data.email, r.data.password);
      router.push({ name: 'dash' });
    }
  } catch (e) {
    msg.value = { text: e instanceof ApiException ? e.message : 'No se pudo conectar con el servidor.', ok: false };
  } finally { busy.value = false; }
}
</script>

<template>
  <section class="login"><div class="lcard">
    <div class="lside">
      <div class="brand"><BrandLogo />Turnos Respiratoria</div>
      <div><h1>Turnos que se arman solos y se reparten parejo</h1><p style="margin-top:12px">Cada servicio con su cuadro, su equipo y sus reglas. Un tablero para ver quién trabaja, cuánto y cada cuánto.</p></div>
      <div class="lfeat">
        <div><i>▦</i><span>Varios cuadros por servicio y por mes</span></div>
        <div><i>☺</i><span>Equipo de planta y apoyo que tú administras</span></div>
        <div><i>▤</i><span>Tablero con horas, noches y descansos por persona</span></div>
      </div>
      <div class="lmini" aria-hidden="true">
        <b v-for="(c, i) in 'MTNLLMTNLLLMTNLLLMTNL'.split('')" :key="i" :class="'s-' + c"></b>
      </div>
    </div>
    <form class="lform" novalidate @submit.prevent="submit">
      <h2>{{ copy.t }}</h2><p class="sub">{{ copy.s }}</p>
      <div v-if="msg" :class="msg.ok ? 'ok-box' : 'err-box'">{{ msg.text }}</div>
      <div class="fld" v-if="signup"><label for="l-name">Nombre completo</label><input id="l-name" v-model="name" autocomplete="name"></div>
      <div class="fld"><label for="l-mail">Correo</label><input id="l-mail" v-model="email" type="email" autocomplete="username" placeholder="nombre@hospital.com"></div>
      <div class="fld"><label for="l-pass">Contraseña</label>
        <div class="pw"><input id="l-pass" v-model="password" :type="showPw ? 'text' : 'password'" :autocomplete="signup ? 'new-password' : 'current-password'"><button type="button" @click="showPw = !showPw">{{ showPw ? 'Ocultar' : 'Mostrar' }}</button></div></div>
      <button class="btn primary" type="submit" :disabled="busy" style="justify-content:center;padding:11px">{{ copy.go }}</button>
      <p style="margin:0;text-align:center;color:var(--muted)">{{ copy.q }} <button class="link" type="button" @click="setMode(!signup)">{{ copy.sw }}</button></p>
      <div class="demo" v-if="demoUsers"><b>Usuarios de prueba</b>
        <div class="dr"><button v-for="d in demos" :key="d.email" type="button" @click="fillDemo(d)"><b>{{ d.label }}</b><small>{{ d.email }} · {{ d.password }}</small></button></div>
        <p class="note" style="margin:8px 0 0">Toca uno para llenar los campos. Los datos son de ejemplo y solo existen en desarrollo.</p></div>
    </form>
  </div></section>
</template>
