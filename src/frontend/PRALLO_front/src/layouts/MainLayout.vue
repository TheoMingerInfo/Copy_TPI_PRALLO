<template>
  <div class="app-layout">
    <header class="navbar">
      <div class="navbar-brand">
        <span class="logo">PRALLO</span>
        <span class="state-badge" :class="`state--${auth.appState}`">{{ stateLabel }}</span>
      </div>

      <nav class="navbar-nav">
        <RouterLink v-if="auth.can('viewProjects')" to="/projects">Les projets</RouterLink>
        <RouterLink v-if="auth.can('viewSkills')" to="/skills">
          {{ auth.isDoyen ? 'Les compétences' : 'Mes compétences' }}
        </RouterLink>
        <RouterLink v-if="auth.can('viewOwnVotes') && auth.isEtudiant" to="/votes">Mes votes</RouterLink>
        <RouterLink v-if="auth.can('viewParticipants')" to="/participants">Les participants</RouterLink>
        <RouterLink v-if="auth.can('viewAllocation')" to="/allocations">La répartition</RouterLink>
        <RouterLink v-if="auth.can('changeState')" to="/state">État</RouterLink>
      </nav>

      <div class="navbar-user">
        <span class="user-name">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</span>
        <span class="user-role">{{ auth.user?.role }}</span>
        <button class="btn-logout" @click="handleLogout">Se déconnecter</button>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>
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

const stateLabel = computed(() => STATE_LABELS[auth.appState] ?? auth.appState)

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.navbar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 0 2rem;
  height: 64px;
  background: #1a1a2e;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e94560;
  letter-spacing: 2px;
}

.state-badge {
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.state--preparation { background: #6c757d; }
.state--reperage { background: #0d6efd; }
.state--vote { background: #198754; }
.state--repartition { background: #fd7e14; }
.state--publication { background: #dc3545; }

.navbar-nav {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.navbar-nav a {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.navbar-nav a:hover,
.navbar-nav a.router-link-active {
  color: white;
  border-bottom-color: #e94560;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
}

.user-role {
  background: rgba(255,255,255,0.15);
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: capitalize;
}

.btn-logout {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.4);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(255,255,255,0.1);
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: #f8f9fa;
}
</style>
