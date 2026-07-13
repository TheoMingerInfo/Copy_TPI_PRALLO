<template>
  <div class="skills-view">
    <div class="view-header">
      <h1>{{ auth.isDoyen ? 'Les compétences' : 'Mes compétences' }}</h1>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <!-- DOYEN view -->
    <template v-if="auth.isDoyen">
      <!-- Add new skill -->
      <div v-if="auth.can('createSkill')" class="add-skill-bar">
        <input
          v-model="newSkillName"
          type="text"
          placeholder="Nom de la nouvelle compétence..."
          class="skill-input"
          @keyup.enter="addSkill"
        />
        <button class="btn btn-primary" :disabled="!newSkillName.trim() || skillsStore.loading" @click="addSkill">
          Ajouter
        </button>
      </div>

      <!-- Bulk actions -->
      <div v-if="selected.length > 0" class="bulk-actions">
        <span class="selected-count">{{ selected.length }} sélectionnée(s)</span>
        <button
          v-if="auth.can('deleteSkill') && selected.length > 0"
          class="btn btn-danger"
          @click="openDeleteConfirm"
        >
          Supprimer la sélection
        </button>
        <button
          v-if="auth.can('mergeSkills') && selected.length === 2"
          class="btn btn-secondary"
          @click="openMergeConfirm"
        >
          Fusionner (la première domine)
        </button>
        <button class="btn btn-ghost" @click="selected = []">Désélectionner tout</button>
      </div>

      <!-- Skills table -->
      <div class="skills-table-wrap">
        <table v-if="!skillsStore.loading" class="skills-table">
          <thead>
            <tr>
              <th class="col-check"></th>
              <th>Compétence</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="skill in skillsStore.skills"
              :key="skill.id"
              :class="{ 'row-selected': selected.includes(skill.id) }"
            >
              <td class="col-check">
                <input
                  type="checkbox"
                  :checked="selected.includes(skill.id)"
                  @change="toggleSelect(skill.id)"
                />
              </td>
              <td class="skill-name-cell">{{ skill.name }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="skillsStore.loading" class="loading-msg">Chargement...</p>
        <p v-if="!skillsStore.loading && skillsStore.skills.length === 0" class="empty-msg">
          Aucune compétence enregistrée.
        </p>
      </div>
    </template>

    <!-- PROFESSEUR view -->
    <template v-else-if="auth.isProfesseur && auth.can('manageOwnSkills')">
      <p class="help-text">Gérez les compétences associées à votre profil.</p>

      <!-- Créer une nouvelle compétence -->
      <div v-if="auth.can('createSkill')" class="add-skill-bar">
        <input
          v-model="newSkillName"
          type="text"
          placeholder="Nom de la nouvelle compétence..."
          class="skill-input"
          @keyup.enter="addSkill"
        />
        <button class="btn btn-primary" :disabled="!newSkillName.trim() || skillsStore.loading" @click="addSkill">
          Ajouter
        </button>
      </div>

      <SkillsManager
        :all-skills="skillsStore.skills"
        :my-skill-ids="mySkillIds"
        @update="handleMySkillsUpdate"
      />
      <div class="prof-actions">
        <button class="btn btn-primary" :disabled="saving" @click="saveMySkills">
          {{ saving ? 'Sauvegarde...' : 'Sauvegarder mes compétences' }}
        </button>
      </div>
    </template>

    <!-- AUTRE vue (invite / etudiant) -->
    <template v-else>
      <p class="empty-msg">Vous n'avez pas accès à la gestion des compétences.</p>
    </template>

    <!-- Delete confirm -->
    <ConfirmModal
      v-if="showDeleteConfirm"
      title="Supprimer les compétences"
      :message="`Supprimer ${selected.length} compétence(s) ? Les projets liés seront mis à jour.`"
      confirm-text="Supprimer"
      :danger-mode="true"
      @confirm="executeDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Merge confirm -->
    <ConfirmModal
      v-if="showMergeConfirm"
      title="Fusionner les compétences"
      :message="mergeMessage"
      confirm-text="Fusionner"
      @confirm="executeMerge"
      @cancel="showMergeConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSkillsStore } from '@/stores/skills'
import api from '@/lib/api'
import SkillsManager from '@/components/SkillsManager.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const auth = useAuthStore()
const skillsStore = useSkillsStore()

const newSkillName = ref('')
const selected = ref<number[]>([])
const showDeleteConfirm = ref(false)
const showMergeConfirm = ref(false)
const errorMsg = ref<string | null>(null)

// Professor my skills
const mySkillIds = ref<number[]>([])
const saving = ref(false)

const mergeMessage = computed(() => {
  if (selected.value.length !== 2) return ''
  const primary = skillsStore.skills.find((s) => s.id === selected.value[0])
  const secondary = skillsStore.skills.find((s) => s.id === selected.value[1])
  return `"${primary?.name}" absorbera "${secondary?.name}". Tous les projets liés à "${secondary?.name}" seront redirigés vers "${primary?.name}".`
})

function toggleSelect(id: number) {
  const idx = selected.value.indexOf(id)
  if (idx === -1) selected.value.push(id)
  else selected.value.splice(idx, 1)
}

async function addSkill() {
  if (!newSkillName.value.trim()) return
  try {
    await skillsStore.createSkill(newSkillName.value.trim())
    newSkillName.value = ''
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors de la création.'
  }
}

function openDeleteConfirm() {
  showDeleteConfirm.value = true
}

async function executeDelete() {
  showDeleteConfirm.value = false
  try {
    await Promise.all(selected.value.map((id) => skillsStore.deleteSkill(id)))
    selected.value = []
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors de la suppression.'
  }
}

function openMergeConfirm() {
  showMergeConfirm.value = true
}

async function executeMerge() {
  showMergeConfirm.value = false
  if (selected.value.length !== 2) return
  try {
    await skillsStore.mergeSkills(selected.value[0], selected.value[1])
    selected.value = []
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors de la fusion.'
  }
}

function handleMySkillsUpdate(newIds: number[]) {
  mySkillIds.value = newIds
}

async function saveMySkills() {
  saving.value = true
  try {
    await api.put(`/participants/${auth.user!.id}/skills`, { skillIds: mySkillIds.value })
    await auth.fetchMe()
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors de la sauvegarde.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await skillsStore.fetchAll()
  if (auth.isProfesseur) {
    mySkillIds.value = (auth.user?.skills ?? []).map((s) => s.id)
  }
})
</script>

<style scoped>
.skills-view {
  max-width: 900px;
  margin: 0 auto;
}

.view-header {
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

.add-skill-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.skill-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.skill-input:focus {
  outline: none;
  border-color: #1a1a2e;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f0f0f8;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.selected-count {
  font-size: 0.875rem;
  color: #1a1a2e;
  font-weight: 600;
}

.skills-table-wrap {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.skills-table {
  width: 100%;
  border-collapse: collapse;
}

.skills-table th {
  background: #1a1a2e;
  color: white;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
}

.skills-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
  color: #333;
}

.skills-table tbody tr:hover {
  background: #fafafa;
}

.row-selected {
  background: #f0f0f8 !important;
}

.col-check {
  width: 40px;
  text-align: center;
}

.skill-name-cell {
  font-weight: 500;
}

.loading-msg,
.empty-msg {
  text-align: center;
  color: #888;
  padding: 2rem;
}

.help-text {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.prof-actions {
  margin-top: 1.25rem;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 18px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
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

.btn-danger {
  background: #e94560;
  color: white;
}

.btn-danger:hover {
  opacity: 0.85;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-ghost {
  background: transparent;
  color: #888;
  border: 1px solid #ddd;
}

.btn-ghost:hover {
  background: #f5f5f5;
}
</style>
