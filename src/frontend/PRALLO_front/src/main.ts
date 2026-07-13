import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const pinia = createPinia()

// Initialiser MSAL et traiter le retour de redirection Azure AVANT que le router monte
const { useAuthStore } = await import('./stores/auth')
const auth = useAuthStore(pinia)
await auth.initMsal()

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
