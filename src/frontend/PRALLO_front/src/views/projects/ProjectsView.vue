<template>
  <div class="projects-view">
    <div class="view-header">
      <h1>Les projets</h1>
      <button v-if="auth.can('createProject')" class="btn btn-primary" @click="openCreate">
        + Ajouter un projet
      </button>
    </div>

    <!-- Search & filter bar -->
    <div class="filter-bar">
      <input
        v-model="searchText"
        type="text"
        placeholder="Rechercher un projet..."
        class="search-input"
        @input="debouncedFetch"
      />
      <div class="skill-filters">
        <span class="filter-label">Filtrer par compétence :</span>
        <div class="skill-filter-tags">
          <span
            v-for="skill in skillsStore.skills"
            :key="skill.id"
            class="skill-filter-tag"
            :class="{ active: selectedSkillIds.includes(skill.id) }"
            @click="toggleSkillFilter(skill.id)"
          >
            {{ skill.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="projectsStore.error" class="error-banner">
      {{ projectsStore.error }}
    </div>

    <!-- Loading -->
    <div v-if="projectsStore.loading" class="loading-msg">Chargement des projets...</div>

    <!-- Empty -->
    <div v-else-if="projectsStore.projects.length === 0 && !projectsStore.loading" class="empty-msg">
      Aucun projet trouvé.
    </div>

    <!-- Project grid -->
    <div v-else class="projects-grid">
      <div v-for="project in projectsStore.projects" :key="project.id" class="card-wrapper">
        <ProjectCard
          :project="project"
          :show-vote-count="auth.can('viewAllVotes')"
          :can-edit="canEditProject(project)"
          :can-delete="canDeleteProject(project)"
          @click-detail="openDetail"
          @click-edit="openEdit"
          @click-delete="confirmDelete"
        />
        <!-- Vote button for students in vote state -->
        <button
          v-if="auth.can('vote') && auth.appState === 'vote' && !hasVotedFor(project.id)"
          class="btn btn-vote"
          :disabled="votesStore.votes.length >= 3"
          @click="castVote(project)"
        >
          {{ votesStore.votes.length >= 3 ? 'Max votes atteint' : 'Voter' }}
        </button>
        <span
          v-else-if="auth.can('vote') && auth.appState === 'vote' && hasVotedFor(project.id)"
          class="voted-badge"
        >
          Vote enregistré
        </span>
      </div>
    </div>

    <!-- Project detail / edit / create modal -->
    <ProjectModal
      v-if="modalOpen"
      :project="selectedProject"
      :mode="modalMode"
      :skills="skillsStore.skills"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete confirm modal -->
    <ConfirmModal
      v-if="deleteTarget"
      title="Supprimer le projet"
      :message="`Voulez-vous supprimer le projet « ${deleteTarget.title} » ? Cette action est irréversible.`"
      confirm-text="Supprimer"
      :danger-mode="true"
      @confirm="executeDelete"
      @cancel="deleteTarget = null"
    />

    <!-- Global error toast -->
    <div v-if="toastError" class="toast-error">{{ toastError }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore, type Project } from '@/stores/projects'
import { useSkillsStore } from '@/stores/skills'
import { useVotesStore } from '@/stores/votes'
import ProjectCard from '@/components/ProjectCard.vue'
import ProjectModal from '@/components/ProjectModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const auth = useAuthStore()
const projectsStore = useProjectsStore()
const skillsStore = useSkillsStore()
const votesStore = useVotesStore()

const searchText = ref('')
const selectedSkillIds = ref<number[]>([])

const modalOpen = ref(false)
const modalMode = ref<'view' | 'edit' | 'create'>('view')
const selectedProject = ref<Project | null>(null)
const deleteTarget = ref<Project | null>(null)
const toastError = ref<string | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchProjects, 300)
}

async function fetchProjects() {
  await projectsStore.fetchAll({
    search: searchText.value || undefined,
    skillIds: selectedSkillIds.value.length > 0 ? selectedSkillIds.value : undefined,
  })
}

function toggleSkillFilter(id: number) {
  const idx = selectedSkillIds.value.indexOf(id)
  if (idx === -1) selectedSkillIds.value.push(id)
  else selectedSkillIds.value.splice(idx, 1)
  fetchProjects()
}

function canEditProject(project: Project): boolean {
  if (auth.can('editAnyProject')) return true
  if (auth.can('editOwnProject') && project.professor.id === auth.user?.id) return true
  if (auth.can('editProjectInVote') && auth.appState === 'vote' && project.professor.id === auth.user?.id) return true
  return false
}

function canDeleteProject(project: Project): boolean {
  if (auth.can('deleteAnyProject')) return true
  if (auth.can('deleteOwnProject') && project.professor.id === auth.user?.id) return true
  return false
}

function openDetail(project: Project) {
  selectedProject.value = project
  modalMode.value = 'view'
  modalOpen.value = true
}

function openEdit(project: Project) {
  selectedProject.value = project
  modalMode.value = 'edit'
  modalOpen.value = true
}

function openCreate() {
  selectedProject.value = null
  modalMode.value = 'create'
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selectedProject.value = null
}

async function handleSave(data: {
  title: string
  description: string
  skillIds: number[]
  isMandatory: boolean
  maxStudents: number
  pendingFiles: File[]
}) {
  try {
    if (modalMode.value === 'create') {
      const project = await projectsStore.createProject(data)
      for (const file of data.pendingFiles) {
        await projectsStore.uploadFile(project.id, file)
      }
    } else if (modalMode.value === 'edit' && selectedProject.value) {
      await projectsStore.updateProject(selectedProject.value.id, data)
    }
    closeModal()
  } catch (e: any) {
    showError(e.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
  }
}

function confirmDelete(project: Project) {
  deleteTarget.value = project
}

async function executeDelete() {
  if (!deleteTarget.value) return
  try {
    await projectsStore.deleteProject(deleteTarget.value.id)
    deleteTarget.value = null
  } catch (e: any) {
    showError(e.response?.data?.message ?? 'Erreur lors de la suppression.')
    deleteTarget.value = null
  }
}

// Votes
function hasVotedFor(projectId: number): boolean {
  return votesStore.votes.some((v) => v.project.id === projectId)
}

async function castVote(project: Project) {
  const used = votesStore.votes.map((v) => v.priority)
  const nextPriority = ([1, 2, 3] as const).find((p) => !used.includes(p))
  if (!nextPriority) return
  try {
    await votesStore.castVote(project.id, nextPriority)
  } catch (e: any) {
    showError(e.response?.data?.message ?? 'Erreur lors du vote.')
  }
}

function showError(msg: string) {
  toastError.value = msg
  setTimeout(() => { toastError.value = null }, 4000)
}

onMounted(async () => {
  await Promise.all([
    fetchProjects(),
    skillsStore.fetchAll(),
    auth.can('vote') ? votesStore.fetchMyVotes() : Promise.resolve(),
  ])
})
</script>

<style scoped>
.projects-view {
  max-width: 1200px;
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

.filter-bar {
  background: white;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-input {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.9rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #1a1a2e;
}

.skill-filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.8rem;
  color: #888;
  font-weight: 600;
  white-space: nowrap;
}

.skill-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.skill-filter-tag {
  background: #f0f0f8;
  color: #1a1a2e;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.skill-filter-tag:hover {
  background: #d0d0e8;
}

.skill-filter-tag.active {
  background: #1a1a2e;
  color: white;
}

.error-banner {
  background: #fff0f3;
  border: 1px solid #e94560;
  color: #e94560;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.loading-msg,
.empty-msg {
  text-align: center;
  color: #888;
  padding: 3rem;
  font-size: 1rem;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1a1a2e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #e94560;
}

.btn-vote {
  background: #198754;
  color: white;
  width: 100%;
}

.btn-vote:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.voted-badge {
  background: #e8f5e9;
  color: #2e7d32;
  text-align: center;
  padding: 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.vote-modal {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  text-align: center;
}

.vote-modal h3 {
  margin: 0;
  color: #1a1a2e;
  font-size: 1.1rem;
}

.vote-modal p {
  margin: 0;
  color: #666;
}

.vote-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.btn-priority {
  background: #1a1a2e;
  color: white;
  padding: 10px;
  width: 100%;
}

.btn-priority:hover {
  background: #e94560;
}

.toast-error {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: #e94560;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
