<template>
  <div class="profile-view">
    <div class="view-header">
      <h1>Mon profil</h1>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success-banner">{{ successMsg }}</div>

    <div class="profile-card">
      <div class="avatar">
        <span class="avatar-initials">{{ initials }}</span>
      </div>
      <div class="profile-info">
        <h2 class="profile-name">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</h2>
        <p class="profile-email">{{ auth.user?.email }}</p>
        <span class="role-badge" :class="`role--${auth.user?.role}`">{{ roleLabel }}</span>
      </div>
    </div>

    <!-- Professor: skills manager -->
    <div v-if="auth.isProfesseur && auth.can('manageOwnSkills')" class="section">
      <h2 class="section-title">Mes compétences</h2>
      <p class="section-desc">Gérez les compétences qui vous sont associées.</p>
      <SkillsManager
        :all-skills="allSkills"
        :my-skill-ids="mySkillIds"
        @update="mySkillIds = $event"
      />
      <div class="section-actions">
        <button class="btn btn-primary" :disabled="saving" @click="saveSkills">
          {{ saving ? 'Sauvegarde...' : 'Sauvegarder les compétences' }}
        </button>
      </div>
    </div>

    <!-- Doyen / Etudiant: show skills read-only -->
    <div v-else-if="myReadOnlySkills.length > 0" class="section">
      <h2 class="section-title">Compétences</h2>
      <div class="skills-tags">
        <span v-for="skill in myReadOnlySkills" :key="skill.id" class="skill-tag">{{ skill.name }}</span>
      </div>
    </div>

    <div v-if="auth.user?.maxProjects !== undefined && auth.user.maxProjects !== null" class="info-row">
      <span class="info-label">Projets maximum :</span>
      <span class="info-value">{{ auth.user.maxProjects }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSkillsStore } from '@/stores/skills'
import api from '@/lib/api'
import SkillsManager from '@/components/SkillsManager.vue'
import type { Skill } from '@/stores/skills'

const auth = useAuthStore()
const skillsStore = useSkillsStore()

const mySkillIds = ref<number[]>([])
const myReadOnlySkills = ref<Skill[]>([])
const saving = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

const initials = computed(() => {
  const first = auth.user?.firstName?.[0] ?? ''
  const last = auth.user?.lastName?.[0] ?? ''
  return (first + last).toUpperCase()
})

const allSkills = computed(() => skillsStore.skills)

const ROLE_LABELS: Record<string, string> = {
  doyen: 'Doyen',
  professeur: 'Professeur',
  etudiant: 'Étudiant',
  invite: 'Invité',
}

const roleLabel = computed(() => ROLE_LABELS[auth.user?.role ?? ''] ?? auth.user?.role ?? '')

async function saveSkills() {
  saving.value = true
  try {
    await api.put(`/participants/${auth.user!.id}/skills`, { skillIds: mySkillIds.value })
    await auth.fetchMe()
    showSuccess('Compétences sauvegardées.')
  } catch (e: any) {
    showError(e.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
  } finally {
    saving.value = false
  }
}

function showError(msg: string) {
  errorMsg.value = msg
  setTimeout(() => { errorMsg.value = null }, 4000)
}

function showSuccess(msg: string) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = null }, 2500)
}

onMounted(async () => {
  await skillsStore.fetchAll()
  if (auth.isProfesseur) {
    mySkillIds.value = (auth.user?.skills ?? []).map((s) => s.id)
  } else {
    myReadOnlySkills.value = auth.user?.skills ?? []
  }
})
</script>

<style scoped>
.profile-view {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #1a1a2e;
}

.error-banner {
  background: #fff0f3;
  border: 1px solid #e94560;
  color: #e94560;
  border-radius: 6px;
  padding: 0.75rem 1rem;
}

.success-banner {
  background: #f0fff4;
  border: 1px solid #2e7d32;
  color: #2e7d32;
  border-radius: 6px;
  padding: 0.75rem 1rem;
}

.profile-card {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-initials {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
}

.profile-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: #1a1a2e;
}

.profile-email {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.role-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
}

.role--doyen { background: #dc3545; }
.role--professeur { background: #0d6efd; }
.role--etudiant { background: #198754; }
.role--invite { background: #6c757d; }

.section {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #1a1a2e;
}

.section-desc {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #888;
}

.section-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.skill-tag {
  background: #f0f0f8;
  color: #1a1a2e;
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 12px;
}

.info-row {
  background: white;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-label {
  font-size: 0.85rem;
  color: #888;
  font-weight: 600;
}

.info-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: #1a1a2e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #e94560;
}
</style>
