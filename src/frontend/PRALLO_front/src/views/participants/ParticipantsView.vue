<template>
  <div class="participants-view">
    <div class="view-header">
      <h1>Les participants</h1>
      <button
        v-if="auth.can('editParticipants') && pendingIds.length > 0"
        class="btn btn-accept"
        :disabled="saving"
        @click="acceptAllChanges"
      >
        {{ saving ? 'Sauvegarde...' : `Accepter les modifications (${pendingIds.length})` }}
      </button>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success-banner">{{ successMsg }}</div>

    <!-- Filtres -->
    <div class="filter-bar">
      <input
        v-model="searchText"
        type="text"
        placeholder="Rechercher par nom ou email..."
        class="search-input"
      />
      <select v-model="filterRole" class="role-filter">
        <option value="">Tous les rôles</option>
        <option value="invite">Invité</option>
        <option value="etudiant">Étudiant</option>
        <option value="professeur">Professeur</option>
        <option value="doyen">Doyen</option>
      </select>
      <span class="results-count">{{ filteredParticipants.length }} résultat{{ filteredParticipants.length !== 1 ? 's' : '' }}</span>
    </div>

    <div v-if="loading" class="loading-msg">Chargement des participants...</div>

    <div v-else class="table-wrap">
      <table class="participants-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Compétences</th>
            <th>Rôle</th>
            <th v-if="auth.can('editParticipants')">Projets max</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="participant in filteredParticipants"
            :key="participant.id"
            :class="{ 'row-pending': pendingIds.includes(participant.id) }"
          >
            <td class="name-cell">
              {{ participant.firstName }} {{ participant.lastName }}
              <span v-if="participant.id === auth.user?.id" class="self-badge">Moi</span>
            </td>
            <td class="email-cell">{{ participant.email }}</td>
            <td class="skills-cell">
              <div class="skills-tags">
                <span
                  v-for="skill in participant.skills"
                  :key="skill.id"
                  class="skill-tag"
                >
                  {{ skill.name }}
                </span>
                <span v-if="participant.skills.length === 0" class="no-skills">—</span>
              </div>
            </td>
            <td class="role-cell">
              <select
                v-if="auth.can('editParticipants')"
                :value="participant.role"
                class="role-select"
                @change="markRoleChange(participant, ($event.target as HTMLSelectElement).value)"
              >
                <option value="invite">Invité</option>
                <option value="etudiant">Étudiant</option>
                <option value="professeur">Professeur</option>
                <option value="doyen">Doyen</option>
              </select>
              <span v-else class="role-badge">{{ participant.role }}</span>
            </td>
            <td v-if="auth.can('editParticipants')" class="max-projects-cell">
              <input
                v-if="participant.role === 'professeur' || participant.role === 'doyen'"
                type="number"
                class="max-input"
                :value="participant.maxProjects ?? 1"
                min="0"
                max="20"
                @change="markMaxProjectsChange(participant, Number(($event.target as HTMLInputElement).value))"
              />
              <span v-else class="no-value">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="filteredParticipants.length === 0" class="empty-msg">Aucun participant trouvé.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import type { UserRole } from '@/stores/auth'

interface Skill {
  id: number
  name: string
}

interface Participant {
  id: number
  firstName: string
  lastName: string
  email: string
  role: UserRole
  maxProjects?: number | null
  skills: Skill[]
}

const auth = useAuthStore()
const participants = ref<Participant[]>([])
const searchText = ref('')
const filterRole = ref('')
const loading = ref(false)

const filteredParticipants = computed(() => {
  const q = searchText.value.toLowerCase().trim()
  return participants.value.filter((p) => {
    const matchesText = !q ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    const matchesRole = !filterRole.value || p.role === filterRole.value
    return matchesText && matchesRole
  })
})
const saving = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const pendingIds = ref<number[]>([])

async function fetchParticipants() {
  loading.value = true
  try {
    const { data } = await api.get('/participants')
    participants.value = data
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors du chargement des participants.'
  } finally {
    loading.value = false
  }
}

function markRoleChange(participant: Participant, newRole: string) {
  participant.role = newRole as UserRole
  if (!pendingIds.value.includes(participant.id)) pendingIds.value.push(participant.id)
}

function markMaxProjectsChange(participant: Participant, value: number) {
  participant.maxProjects = value
  if (!pendingIds.value.includes(participant.id)) pendingIds.value.push(participant.id)
}

async function acceptAllChanges() {
  saving.value = true
  try {
    const pending = participants.value.filter((p) => pendingIds.value.includes(p.id))
    for (const participant of pending) {
      await api.put(`/participants/${participant.id}/role`, { role: participant.role })
      if (participant.role === 'professeur' || participant.role === 'doyen') {
        await api.put(`/participants/${participant.id}/max-projects`, {
          maxProjects: participant.maxProjects ?? 1,
        })
      }
    }
    pendingIds.value = []
    showSuccess(`${pending.length} modification(s) acceptée(s).`)
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

onMounted(fetchParticipants)
</script>

<style scoped>
.participants-view {
  max-width: 1100px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
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
  margin-bottom: 1rem;
}

.success-banner {
  background: #f0fff4;
  border: 1px solid #2e7d32;
  color: #2e7d32;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 7px 12px;
  font-size: 0.875rem;
  color: #1a1a2e;
}

.search-input:focus {
  outline: none;
  border-color: #1a1a2e;
}

.role-filter {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 7px 12px;
  font-size: 0.875rem;
  color: #1a1a2e;
  background: white;
  cursor: pointer;
}

.role-filter:focus {
  outline: none;
  border-color: #1a1a2e;
}

.results-count {
  font-size: 0.8rem;
  color: #888;
  white-space: nowrap;
}

.loading-msg {
  text-align: center;
  color: #888;
  padding: 3rem;
}

.table-wrap {
  background: white;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
}

.participants-table th {
  background: #1a1a2e;
  color: white;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.participants-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.participants-table tbody tr:last-child td {
  border-bottom: none;
}

.participants-table tbody tr:hover {
  background: #fafafa;
}

.row-pending {
  background: #fffbe6 !important;
  border-left: 3px solid #f59e0b;
}

.name-cell {
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.self-badge {
  background: #e94560;
  color: white;
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 700;
}

.email-cell {
  color: #666;
  font-size: 0.875rem;
}

.skills-cell {
  max-width: 260px;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.skill-tag {
  background: #f0f0f8;
  color: #1a1a2e;
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 10px;
}

.no-skills,
.no-value {
  color: #bbb;
}

.role-select {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85rem;
  color: #1a1a2e;
  cursor: pointer;
  background: white;
}

.role-select:focus {
  outline: none;
  border-color: #1a1a2e;
}

.role-badge {
  display: inline-block;
  background: #f0f0f8;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.max-input {
  width: 70px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.875rem;
  text-align: center;
}

.max-input:focus {
  outline: none;
  border-color: #1a1a2e;
}

.empty-msg {
  text-align: center;
  color: #888;
  padding: 2rem;
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

.btn-accept {
  background: #198754;
  color: white;
}

.btn-accept:hover:not(:disabled) {
  opacity: 0.85;
}
</style>
