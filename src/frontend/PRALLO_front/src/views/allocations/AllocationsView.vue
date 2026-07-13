<template>
  <div class="allocations-view">
    <div class="view-header">
      <h1>La répartition</h1>
      <button
        v-if="auth.can('editAllocation') && pendingIds.length > 0"
        class="btn btn-accept"
        :disabled="saving"
        @click="acceptAllChanges"
      >
        {{ saving ? 'Sauvegarde...' : `Accepter les modifications (${pendingIds.length})` }}
      </button>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success-banner">{{ successMsg }}</div>

    <!-- Indice de satisfaction (doyen uniquement, en mode répartition) -->
    <div v-if="auth.can('viewSatisfactionIndex') && satisfaction" class="satisfaction-card">
      <div class="satisfaction-header">
        <span class="satisfaction-title">Indice de satisfaction</span>
        <span class="satisfaction-pct" :class="satisfactionClass">{{ satisfaction.percentage }}%</span>
      </div>
      <div class="satisfaction-details">
        <span class="sat-badge sat-1">1er choix : {{ satisfaction.firstChoice }}</span>
        <span class="sat-badge sat-2">2ème choix : {{ satisfaction.secondChoice }}</span>
        <span class="sat-badge sat-3">3ème choix : {{ satisfaction.thirdChoice }}</span>
        <span class="sat-badge sat-none">Non voté : {{ satisfaction.noVote }}</span>
      </div>
      <div class="satisfaction-meta">{{ satisfaction.assigned }} étudiant(s) assigné(s)</div>
    </div>

    <!-- Filtres -->
    <div v-if="!loading && allocations.length > 0" class="filter-bar">
      <input
        v-model="searchText"
        type="text"
        placeholder="Rechercher par projet, étudiant ou professeur..."
        class="search-input"
      />
      <span class="results-count">{{ filteredAllocations.length }} / {{ allocations.length }}</span>
    </div>

    <div v-if="loading" class="loading-msg">Chargement de la répartition...</div>

    <div v-else-if="allocations.length === 0" class="empty-msg">
      Aucune répartition disponible pour le moment.
    </div>

    <div v-else class="table-wrap">
      <table class="allocations-table">
        <thead>
          <tr>
            <th>Projet</th>
            <th>Étudiant</th>
            <th>Professeur</th>
            <th v-if="auth.can('editAllocation')">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="alloc in filteredAllocations"
            :key="alloc.id"
            :class="{ 'row-pending': pendingIds.includes(alloc.id) }"
          >
            <td class="project-cell">
              <span class="project-name">{{ alloc.project.title }}</span>
              <span v-if="alloc.project.isMandatory" class="mandatory-icon" title="Obligatoire">!</span>
            </td>
            <td class="student-cell">
              <select
                v-if="auth.can('editAllocation')"
                :value="alloc.student?.id ?? ''"
                class="alloc-select"
                @change="markStudentChange(alloc, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">— Non assigné —</option>
                <option v-for="s in students" :key="s.id" :value="s.id">
                  {{ s.firstName }} {{ s.lastName }}
                </option>
              </select>
              <span v-else>
                {{ alloc.student ? `${alloc.student.firstName} ${alloc.student.lastName}` : '—' }}
              </span>
            </td>
            <td class="professor-cell">
              <select
                v-if="auth.can('editAllocation')"
                :value="alloc.professor?.id ?? ''"
                class="alloc-select"
                @change="markProfessorChange(alloc, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">— Non assigné —</option>
                <option v-for="p in professors" :key="p.id" :value="p.id">
                  {{ p.firstName }} {{ p.lastName }}
                </option>
              </select>
              <span v-else>
                {{ alloc.professor ? `${alloc.professor.firstName} ${alloc.professor.lastName}` : '—' }}
              </span>
            </td>
            <td v-if="auth.can('editAllocation')" class="action-cell">
              <button class="btn btn-sm btn-danger" @click="removeAllocation(alloc)">Retirer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'

interface SatisfactionData {
  percentage: number
  assigned: number
  firstChoice: number
  secondChoice: number
  thirdChoice: number
  noVote: number
}

interface PersonRef {
  id: number
  firstName: string
  lastName: string
}

interface ProjectRef {
  id: number
  title: string
  isMandatory: boolean
}

interface Allocation {
  id: number
  project: ProjectRef
  student: PersonRef | null
  professor: PersonRef | null
}

const auth = useAuthStore()
const allocations = ref<Allocation[]>([])
const students = ref<PersonRef[]>([])
const professors = ref<PersonRef[]>([])
const searchText = ref('')
const loading = ref(false)
const satisfaction = ref<SatisfactionData | null>(null)

const satisfactionClass = computed(() => {
  if (!satisfaction.value) return ''
  const p = satisfaction.value.percentage
  if (p >= 75) return 'pct-high'
  if (p >= 50) return 'pct-mid'
  return 'pct-low'
})

const filteredAllocations = computed(() => {
  const q = searchText.value.toLowerCase().trim()
  if (!q) return allocations.value
  return allocations.value.filter((a) => {
    const project = a.project.title.toLowerCase()
    const student = a.student ? `${a.student.firstName} ${a.student.lastName}`.toLowerCase() : ''
    const professor = a.professor ? `${a.professor.firstName} ${a.professor.lastName}`.toLowerCase() : ''
    return project.includes(q) || student.includes(q) || professor.includes(q)
  })
})
const saving = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const pendingIds = ref<number[]>([])

async function fetchAllocations() {
  loading.value = true
  try {
    const { data } = await api.get('/allocations')
    allocations.value = data
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors du chargement de la répartition.'
  } finally {
    loading.value = false
  }
}

async function fetchSatisfaction() {
  if (!auth.can('viewSatisfactionIndex')) return
  try {
    const { data } = await api.get('/allocations/satisfaction')
    satisfaction.value = data
  } catch {
    // silently ignore
  }
}

async function fetchUsers() {
  try {
    const { data } = await api.get('/participants')
    students.value = data.filter((u: any) => u.role === 'etudiant')
    professors.value = data.filter((u: any) => u.role === 'professeur' || u.role === 'doyen')
  } catch {
    // silently ignore
  }
}

function markStudentChange(alloc: Allocation, studentId: string) {
  alloc.student = studentId ? students.value.find((s) => s.id === Number(studentId)) ?? null : null
  if (!pendingIds.value.includes(alloc.id)) pendingIds.value.push(alloc.id)
}

function markProfessorChange(alloc: Allocation, professorId: string) {
  alloc.professor = professorId ? professors.value.find((p) => p.id === Number(professorId)) ?? null : null
  if (!pendingIds.value.includes(alloc.id)) pendingIds.value.push(alloc.id)
}

async function acceptAllChanges() {
  saving.value = true
  try {
    const pending = allocations.value.filter((a) => pendingIds.value.includes(a.id))
    for (const alloc of pending) {
      await api.put(`/allocations/${alloc.project.id}`, {
        studentId: alloc.student?.id ?? null,
        professorId: alloc.professor?.id ?? undefined,
      })
    }
    pendingIds.value = []
    showSuccess(`${pending.length} modification(s) acceptée(s).`)
    await fetchSatisfaction()
  } catch (e: any) {
    showError(e.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
  } finally {
    saving.value = false
  }
}

async function removeAllocation(alloc: Allocation) {
  const prev = alloc.student
  alloc.student = null
  // Retirer est immédiat — pas besoin de confirmation
  pendingIds.value = pendingIds.value.filter((id) => id !== alloc.id)
  try {
    await api.put(`/allocations/${alloc.project.id}`, { studentId: null })
    showSuccess('Étudiant retiré.')
    await fetchSatisfaction()
  } catch (e: any) {
    alloc.student = prev
    showError(e.response?.data?.message ?? 'Erreur lors de la suppression.')
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
  await Promise.all([
    fetchAllocations(),
    auth.can('editAllocation') ? fetchUsers() : Promise.resolve(),
    fetchSatisfaction(),
  ])
})
</script>

<style scoped>
.allocations-view {
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

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 220px;
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

.results-count {
  font-size: 0.8rem;
  color: #888;
  white-space: nowrap;
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

.loading-msg,
.empty-msg {
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

.allocations-table {
  width: 100%;
  border-collapse: collapse;
}

.allocations-table th {
  background: #1a1a2e;
  color: white;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
}

.allocations-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.allocations-table tbody tr:last-child td {
  border-bottom: none;
}

.allocations-table tbody tr:hover {
  background: #fafafa;
}

.row-pending {
  background: #fffbe6 !important;
  border-left: 3px solid #f59e0b;
}

.project-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.project-name {
  font-weight: 600;
  color: #1a1a2e;
}

.mandatory-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #e94560;
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.student-cell,
.professor-cell {
  color: #555;
  font-size: 0.9rem;
}

.alloc-select {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85rem;
  color: #1a1a2e;
  background: white;
  cursor: pointer;
  min-width: 180px;
}

.alloc-select:focus {
  outline: none;
  border-color: #1a1a2e;
}

.action-cell {
  text-align: right;
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

.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
}

.btn-accept {
  background: #198754;
  color: white;
}

.btn-accept:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-danger {
  background: #e94560;
  color: white;
}

.btn-danger:hover {
  opacity: 0.85;
}

/* ── Satisfaction card ── */
.satisfaction-card {
  background: white;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #1a1a2e;
}

.satisfaction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.satisfaction-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1a1a2e;
}

.satisfaction-pct {
  font-size: 1.5rem;
  font-weight: 700;
}

.pct-high { color: #198754; }
.pct-mid  { color: #f59e0b; }
.pct-low  { color: #e94560; }

.satisfaction-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.sat-badge {
  font-size: 0.78rem;
  padding: 2px 9px;
  border-radius: 10px;
  font-weight: 500;
}

.sat-1   { background: #d1fae5; color: #065f46; }
.sat-2   { background: #dbeafe; color: #1e3a8a; }
.sat-3   { background: #fef9c3; color: #713f12; }
.sat-none { background: #f3f4f6; color: #6b7280; }

.satisfaction-meta {
  font-size: 0.78rem;
  color: #888;
}
</style>
