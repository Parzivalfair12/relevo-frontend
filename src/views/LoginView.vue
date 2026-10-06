<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { loginSchema, registerSchema } from '@/shared';
import BrandLogo from '@/components/BrandLogo.vue';
import LangToggle from '@/components/LangToggle.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { useAuth } from '@/stores/auth';
import { ApiException } from '@/lib/api';
import { tm } from '@/i18n';

const auth = useAuth(), router = useRouter();
const { t } = useI18n();
const signup = ref(false), showPw = ref(false), busy = ref(false);
const name = ref(''), email = ref(''), password = ref('');
const msg = ref<{ text: string; ok: boolean } | null>(null);
const copy = computed(() => {
  const k = signup.value ? 'login.signup' : 'login.signin';
  return { t: t(`${k}.title`), s: t(`${k}.sub`), go: t(`${k}.go`), q: t(`${k}.q`), sw: t(`${k}.switch`) };
});

function setMode(su: boolean) { signup.value = su; msg.value = null; }

async function submit() {
  msg.value = null;
  try {
    if (signup.value) {
      const r = registerSchema.safeParse({ name: name.value, email: email.value, password: password.value });
      if (!r.success) return void (msg.value = { text: tm(r.error.issues[0].message), ok: false }); // mensajes en español del esquema compartido
      busy.value = true; await auth.register(r.data.name, r.data.email, r.data.password);
      setMode(false); password.value = '';
      msg.value = { text: t('login.requestSent'), ok: true };
    } else {
      const r = loginSchema.safeParse({ email: email.value, password: password.value });
      if (!r.success) return void (msg.value = { text: t('login.badCredentials'), ok: false });
      busy.value = true; await auth.login(r.data.email, r.data.password);
      router.push({ name: 'dash' });
    }
  } catch (e) {
    msg.value = { text: e instanceof ApiException ? tm(e.message) : t('common.noConnection'), ok: false };
  } finally { busy.value = false; }
}
</script>

<template>
  <section class="login"><div style="position:fixed;top:calc(16px + env(safe-area-inset-top,0px));right:16px;z-index:5;display:flex;gap:8px"><LangToggle /><ThemeToggle /></div><div class="lcard">
    <div class="lside">
      <div class="brand"><BrandLogo word /></div>
      <div><h1>{{ t('login.headline') }}</h1><p style="margin-top:12px">{{ t('login.lead') }}</p></div>
      <div class="lfeat">
        <div><i>▦</i><span>{{ t('login.feat1') }}</span></div>
        <div><i>☺</i><span>{{ t('login.feat2') }}</span></div>
        <div><i>▤</i><span>{{ t('login.feat3') }}</span></div>
      </div>
      <div class="lmini" aria-hidden="true">
        <b v-for="(c, i) in 'MTNLLMTNLLLMTNLLLMTNL'.split('')" :key="i" :class="'s-' + c"></b>
      </div>
    </div>
    <form class="lform" novalidate @submit.prevent="submit">
      <h2>{{ copy.t }}</h2><p class="sub">{{ copy.s }}</p>
      <div v-if="msg" :class="msg.ok ? 'ok-box' : 'err-box'">{{ msg.text }}</div>
      <div class="fld" v-if="signup"><label for="l-name">{{ t('login.fullName') }}</label><input id="l-name" v-model="name" autocomplete="name"></div>
      <div class="fld"><label for="l-mail">{{ t('login.email') }}</label><input id="l-mail" v-model="email" type="email" autocomplete="username" :placeholder="t('login.emailPlaceholder')"></div>
      <div class="fld"><label for="l-pass">{{ t('login.password') }}</label>
        <div class="pw"><input id="l-pass" v-model="password" :type="showPw ? 'text' : 'password'" :autocomplete="signup ? 'new-password' : 'current-password'"><button type="button" @click="showPw = !showPw">{{ showPw ? t('login.hide') : t('login.show') }}</button></div></div>
      <button class="btn primary" type="submit" :disabled="busy" style="justify-content:center;padding:11px">{{ copy.go }}</button>
      <p style="margin:0;text-align:center;color:var(--muted)">{{ copy.q }} <button class="link" type="button" @click="setMode(!signup)">{{ copy.sw }}</button></p>
    </form>
  </div></section>
</template>
