import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { onSessionLost } from './lib/api';
import { useAuth } from './stores/auth';
import { i18n } from './i18n';
import { applyTheme } from './lib/theme';
import './styles/tokens.css';
import './styles/global.css';

applyTheme();
const pinia = createPinia();
// Si la renovación de sesión falla en medio del uso, se vuelve al login
onSessionLost(() => { useAuth(pinia).clear(); if (router.currentRoute.value.name !== 'login') router.push({ name: 'login' }); });

createApp(App).use(pinia).use(i18n).use(router).mount('#app');
