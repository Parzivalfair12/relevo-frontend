import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { onSessionLost } from './lib/api';
import { useAuth } from './stores/auth';
import './styles/tokens.css';
import './styles/global.css';

const pinia = createPinia();
// Si la renovación de sesión falla en medio del uso, se vuelve al login
onSessionLost(() => { useAuth(pinia).clear(); if (router.currentRoute.value.name !== 'login') router.push({ name: 'login' }); });

createApp(App).use(pinia).use(router).mount('#app');
