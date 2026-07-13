<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">PRALLO</div>
      <p class="login-subtitle">Project Allocator — ETML</p>

      <div class="login-actions">
        <button class="btn-microsoft" :disabled="loading" @click="handleMsalLogin">
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F35325"/>
            <rect x="11" y="1" width="9" height="9" fill="#81BC06"/>
            <rect x="1" y="11" width="9" height="9" fill="#05A6F0"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFBA08"/>
          </svg>
          {{ loading ? 'Redirection...' : 'Se connecter avec Eduvaud' }}
        </button>

        <div v-if="isDevMode" class="dev-bypass">
          <hr>
          <p class="dev-label">🛠 Mode développement — Bypass</p>
          <select v-model="selectedEmail" class="dev-select">
            <option value="">Choisir un utilisateur...</option>
            <option v-for="u in devUsers" :key="u.email" :value="u.email">
              {{ u.label }} ({{ u.role }})
            </option>
          </select>
          <button class="btn-dev" :disabled="!selectedEmail || loading" @click="handleDevBypass">
            Se connecter (bypass)
          </button>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const errorMsg = ref('')
const selectedEmail = ref('')
const isDevMode = import.meta.env.VITE_DEV_BYPASS === 'true'

const devUsers = [
  { email: 'alice.doyen@eduvaud.ch', label: 'Alice Doyen', role: 'doyen' },
  { email: 'bob.martin@eduvaud.ch', label: 'Bob Martin', role: 'professeur' },
  { email: 'claire.dupont@eduvaud.ch', label: 'Claire Dupont', role: 'professeur' },
  { email: 'emma.muller@eduvaud.ch', label: 'Emma Muller', role: 'etudiant' },
  { email: 'felix.renaud@eduvaud.ch', label: 'Felix Renaud', role: 'etudiant' },
  { email: 'karl.invite@eduvaud.ch', label: 'Karl Invité', role: 'invite' },
]

async function handleMsalLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.loginWithAzure()
    // Le navigateur part vers Microsoft — loading reste à true (la page disparaît)
  } catch (e: any) {
    errorMsg.value = e.message ?? 'Erreur de connexion'
    loading.value = false
  }
}

async function handleDevBypass() {
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.loginDevBypass(selectedEmail.value)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect || '/')
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur de connexion bypass'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 3rem 2.5rem;
  width: 380px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.login-logo {
  font-size: 2.5rem;
  font-weight: 800;
  color: #e94560;
  letter-spacing: 4px;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.btn-microsoft {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 12px 20px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-microsoft:hover:not(:disabled) { background: #006bbd; }
.btn-microsoft:disabled { opacity: 0.6; cursor: not-allowed; }

.dev-bypass { margin-top: 1.5rem; }

.dev-label {
  font-size: 0.8rem;
  color: #fd7e14;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.dev-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.btn-dev {
  width: 100%;
  padding: 10px;
  background: #fd7e14;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-dev:hover:not(:disabled) { background: #e8700e; }
.btn-dev:disabled { opacity: 0.5; cursor: not-allowed; }

.error-msg {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 1rem;
  padding: 8px 12px;
  background: #f8d7da;
  border-radius: 6px;
}
</style>
