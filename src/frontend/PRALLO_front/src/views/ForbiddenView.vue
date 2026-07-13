<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <div class="forbidden-icon">🚫</div>
      <h1 class="forbidden-title">Accès refusé</h1>
      <p class="forbidden-message">{{ message }}</p>
      <p v-if="stateInfo" class="state-info">{{ stateInfo }}</p>
      <div class="forbidden-actions">
        <RouterLink to="/projects" class="btn btn-primary">Retour aux projets</RouterLink>
        <button class="btn btn-secondary" @click="goBack">Page précédente</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const STATE_LABELS: Record<string, string> = {
  preparation: 'Préparation',
  reperage: 'Repérage',
  vote: 'Vote',
  repartition: 'Répartition',
  publication: 'Publication',
}

const message = computed(() => {
  if (!auth.isAuthenticated) {
    return 'Vous devez être connecté pour accéder à cette page.'
  }
  if (auth.isInvite) {
    return 'Votre compte invite ne dispose pas des droits nécessaires pour accéder à cette ressource.'
  }
  return 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'
})

const stateInfo = computed(() => {
  if (!auth.isAuthenticated) return null
  const label = STATE_LABELS[auth.appState]
  return label ? `État actuel du système : ${label}. Certaines fonctionnalités sont limitées à cet état.` : null
})

function goBack() {
  router.back()
}
</script>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  padding: 2rem;
}

.forbidden-card {
  background: white;
  border-radius: 12px;
  padding: 3rem 2.5rem;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.forbidden-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  line-height: 1;
}

.forbidden-title {
  font-size: 1.75rem;
  color: #1a1a2e;
  margin: 0 0 1rem 0;
}

.forbidden-message {
  color: #555;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
}

.state-info {
  color: #888;
  font-size: 0.875rem;
  background: #f0f0f8;
  border-radius: 6px;
  padding: 0.625rem 1rem;
  margin-bottom: 0;
  line-height: 1.5;
}

.forbidden-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 22px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s, background 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #1a1a2e;
  color: white;
}

.btn-primary:hover {
  background: #e94560;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
