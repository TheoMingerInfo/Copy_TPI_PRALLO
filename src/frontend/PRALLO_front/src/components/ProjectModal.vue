<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="btn-close" @click="handleClose">&times;</button>
      </div>

      <div class="modal-body">
        <!-- VIEW mode -->
        <template v-if="mode === 'view' && project">
          <div class="view-field">
            <label>Titre</label>
            <p>{{ project.title }}</p>
          </div>
          <div class="view-field">
            <label>Description</label>
            <p class="description-text">{{ project.description }}</p>
          </div>
          <div class="view-field">
            <label>Compétences</label>
            <div class="skills-display">
              <span v-if="project.skills.length === 0" class="no-skills">Aucune compétence</span>
              <span v-for="skill in project.skills" :key="skill.id" class="skill-tag">{{ skill.name }}</span>
            </div>
          </div>
          <div class="view-row">
            <div class="view-field">
              <label>Professeur</label>
              <p>{{ project.professor.firstName }} {{ project.professor.lastName }}</p>
            </div>
            <div class="view-field">
              <label>Étudiants max</label>
              <p>{{ project.maxStudents }}</p>
            </div>
            <div class="view-field">
              <label>Obligatoire</label>
              <p>{{ project.isMandatory ? 'Oui' : 'Non' }}</p>
            </div>
          </div>
          <div v-if="project.voteCount !== undefined" class="view-field">
            <label>Votes reçus</label>
            <p>{{ project.voteCount }}</p>
          </div>

          <!-- Fichiers -->
          <div class="view-field">
            <label>Fichiers joints</label>
            <div v-if="loadingFiles" class="files-loading">Chargement...</div>
            <div v-else-if="detailFiles.length === 0" class="no-files">Aucun fichier joint</div>
            <ul v-else class="files-list">
              <li v-for="f in detailFiles" :key="f.id" class="file-item">
                <span class="file-name">{{ f.fileName }}</span>
                <span class="file-size">{{ formatSize(f.fileSize) }}</span>
                <button class="btn-file-action" @click="downloadFile(f)">Télécharger</button>
              </li>
            </ul>
          </div>
        </template>

        <!-- EDIT / CREATE mode -->
        <template v-else-if="mode === 'edit' || mode === 'create'">
          <div class="form-field" :class="{ error: errors.title }">
            <label for="proj-title">Titre <span class="required">*</span></label>
            <input
              id="proj-title"
              v-model="form.title"
              type="text"
              maxlength="30"
              placeholder="Titre du projet (max 30 caractères)"
              @input="validateTitle"
            />
            <span class="char-count">{{ form.title.length }}/30</span>
            <span v-if="errors.title" class="error-msg">{{ errors.title }}</span>
          </div>

          <div class="form-field" :class="{ error: errors.description }">
            <label for="proj-desc">Description <span class="required">*</span></label>
            <textarea
              id="proj-desc"
              v-model="form.description"
              rows="5"
              maxlength="350"
              placeholder="Description du projet (max 350 caractères)"
              @input="validateDescription"
            ></textarea>
            <span class="char-count">{{ form.description.length }}/350</span>
            <span v-if="errors.description" class="error-msg">{{ errors.description }}</span>
          </div>

          <div class="form-field" :class="{ error: errors.skillIds }">
            <label>Compétences <span class="required">*</span></label>
            <div class="skills-select">
              <div
                v-for="skill in skills"
                :key="skill.id"
                class="skill-option"
                :class="{ selected: form.skillIds.includes(skill.id) }"
                @click="toggleSkill(skill.id)"
              >
                {{ skill.name }}
              </div>
            </div>
            <span v-if="errors.skillIds" class="error-msg">{{ errors.skillIds }}</span>
          </div>

          <!-- Fichiers -->
          <div v-if="mode === 'edit' || mode === 'create'" class="form-field">
            <label>Fichiers joints</label>

            <!-- Fichiers existants (mode édition) -->
            <template v-if="mode === 'edit'">
              <div v-if="loadingFiles" class="files-loading">Chargement...</div>
              <ul v-else-if="detailFiles.length > 0" class="files-list">
                <li v-for="f in detailFiles" :key="f.id" class="file-item">
                  <span class="file-name">{{ f.fileName }}</span>
                  <span class="file-size">{{ formatSize(f.fileSize) }}</span>
                  <button class="btn-file-action" @click="downloadFile(f)">↓</button>
                  <button class="btn-file-delete" :disabled="deletingFileId === f.id" @click="handleDeleteFile(f.id)">✕</button>
                </li>
              </ul>
            </template>

            <!-- Fichiers en attente (mode création) -->
            <template v-else-if="mode === 'create'">
              <ul v-if="pendingFiles.length > 0" class="files-list">
                <li v-for="(f, idx) in pendingFiles" :key="idx" class="file-item">
                  <span class="file-name">{{ f.name }}</span>
                  <span class="file-size">{{ formatSize(f.size) }}</span>
                  <button class="btn-file-delete" @click="removePendingFile(idx)">✕</button>
                </li>
              </ul>
            </template>

            <div class="file-upload-area">
              <label class="btn-file-upload" :class="{ uploading: uploadingFile }">
                <input
                  ref="fileInputRef"
                  type="file"
                  :accept="allowedTypes"
                  :disabled="uploadingFile"
                  style="display: none"
                  @change="handleFileUpload"
                />
                {{ uploadingFile ? 'Envoi en cours...' : '+ Joindre un fichier' }}
              </label>
              <span class="file-hint">PDF, Word, Excel, image, ZIP — max 10 Mo</span>
              <span v-if="fileError" class="error-msg">{{ fileError }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field" :class="{ error: errors.maxStudents }">
              <label for="proj-max">Étudiants max <span class="required">*</span></label>
              <input
                id="proj-max"
                v-model.number="form.maxStudents"
                type="number"
                min="1"
                max="10"
                @input="validateMaxStudents"
              />
              <span v-if="errors.maxStudents" class="error-msg">{{ errors.maxStudents }}</span>
            </div>

            <div class="form-field checkbox-field">
              <label :class="{ disabled: !auth.can('setMandatory') }">
                <input v-model="form.isMandatory" type="checkbox" :disabled="!auth.can('setMandatory')" />
                Projet obligatoire
              </label>
            </div>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">Fermer</button>
        <button
          v-if="mode !== 'view'"
          class="btn btn-primary"
          @click="handleSave"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectsStore, type Project, type ProjectFile, type Skill } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  project: Project | null
  mode: 'view' | 'edit' | 'create'
  skills: Skill[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: { title: string; description: string; skillIds: number[]; isMandatory: boolean; maxStudents: number; pendingFiles: File[] }]
}>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()

const detailFiles = ref<ProjectFile[]>([])
const pendingFiles = ref<File[]>([])
const loadingFiles = ref(false)
const uploadingFile = ref(false)
const deletingFileId = ref<number | null>(null)
const fileError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const allowedTypes = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt'

async function fetchFiles() {
  if (!props.project) return
  loadingFiles.value = true
  try {
    const fetched = await projectsStore.fetchById(props.project.id)
    detailFiles.value = fetched.files ?? []
  } catch {
    detailFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fileError.value = ''
  if (props.mode === 'create') {
    pendingFiles.value.push(file)
    if (fileInputRef.value) fileInputRef.value.value = ''
    return
  }
  uploadToServer(file)
}

async function uploadToServer(file: File) {
  if (!props.project) return
  uploadingFile.value = true
  try {
    const uploaded = await projectsStore.uploadFile(props.project.id, file)
    detailFiles.value.push(uploaded)
  } catch (e: any) {
    fileError.value = e.response?.data?.message ?? 'Erreur lors de l\'envoi du fichier.'
  } finally {
    uploadingFile.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function removePendingFile(idx: number) {
  pendingFiles.value.splice(idx, 1)
}

async function handleDeleteFile(fileId: number) {
  if (!props.project) return
  deletingFileId.value = fileId
  try {
    await projectsStore.deleteFile(props.project.id, fileId)
    detailFiles.value = detailFiles.value.filter((f) => f.id !== fileId)
  } catch (e: any) {
    fileError.value = e.response?.data?.message ?? 'Erreur lors de la suppression.'
  } finally {
    deletingFileId.value = null
  }
}

async function downloadFile(file: ProjectFile) {
  if (!props.project) return
  try {
    await projectsStore.downloadFile(props.project.id, file.id, file.fileName)
  } catch {
    fileError.value = 'Erreur lors du téléchargement.'
  }
}

function handleClose() {
  emit('close')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const form = ref({
  title: '',
  description: '',
  skillIds: [] as number[],
  isMandatory: false,
  maxStudents: 1,
})

const errors = ref({
  title: '',
  description: '',
  maxStudents: '',
  skillIds: '',
})

const modalTitle = computed(() => {
  if (props.mode === 'create') return 'Nouveau projet'
  if (props.mode === 'edit') return 'Modifier le projet'
  return props.project?.title ?? 'Détail du projet'
})

watch(
  () => props.project,
  (proj) => {
    detailFiles.value = []
    pendingFiles.value = []
    fileError.value = ''
    if (proj && props.mode !== 'create') {
      form.value = {
        title: proj.title,
        description: proj.description,
        skillIds: proj.skills.map((s) => s.id),
        isMandatory: proj.isMandatory,
        maxStudents: proj.maxStudents,
      }
      fetchFiles()
    } else {
      form.value = { title: '', description: '', skillIds: [], isMandatory: false, maxStudents: 1 }
    }
    errors.value = { title: '', description: '', maxStudents: '', skillIds: '' }
  },
  { immediate: true }
)

function validateTitle() {
  errors.value.title = form.value.title.trim().length === 0 ? 'Le titre est requis.' : ''
}

function validateDescription() {
  errors.value.description = form.value.description.trim().length === 0 ? 'La description est requise.' : ''
}

function validateMaxStudents() {
  const v = form.value.maxStudents
  errors.value.maxStudents = !v || v < 1 ? 'Minimum 1 étudiant requis.' : ''
}

function validateSkillIds() {
  errors.value.skillIds = form.value.skillIds.length === 0 ? 'Au moins une compétence est requise.' : ''
}

const isFormValid = computed(() => {
  return (
    form.value.title.trim().length > 0 &&
    form.value.description.trim().length > 0 &&
    form.value.maxStudents >= 1 &&
    form.value.skillIds.length > 0 &&
    !errors.value.title &&
    !errors.value.description &&
    !errors.value.maxStudents &&
    !errors.value.skillIds
  )
})

function toggleSkill(id: number) {
  const idx = form.value.skillIds.indexOf(id)
  if (idx === -1) {
    form.value.skillIds.push(id)
  } else {
    form.value.skillIds.splice(idx, 1)
  }
  if (errors.value.skillIds) validateSkillIds()
}

function handleSave() {
  validateTitle()
  validateDescription()
  validateMaxStudents()
  validateSkillIds()
  if (!isFormValid.value) return
  emit('save', { ...form.value, pendingFiles: pendingFiles.value })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #1a1a2e;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
  line-height: 1;
  padding: 0 4px;
}

.btn-close:hover {
  color: #e94560;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.view-field label,
.form-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.view-field p {
  margin: 0;
  color: #1a1a2e;
}

.description-text {
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.6;
  overflow-wrap: break-word;
  word-break: break-word;
}

.view-row {
  display: flex;
  gap: 2rem;
}

.skills-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.skill-tag {
  background: #f0f0f8;
  color: #1a1a2e;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
}

.no-skills {
  color: #aaa;
  font-size: 0.875rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field input[type="text"],
.form-field input[type="number"],
.form-field textarea {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #1a1a2e;
  transition: border-color 0.2s;
}

.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #1a1a2e;
}

.form-field.error input,
.form-field.error textarea {
  border-color: #e94560;
}

.char-count {
  font-size: 0.75rem;
  color: #aaa;
  text-align: right;
}

.error-msg {
  font-size: 0.8rem;
  color: #e94560;
}

.required {
  color: #e94560;
}

.skills-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  min-height: 48px;
}

.skill-option {
  background: #f0f0f8;
  color: #1a1a2e;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.skill-option:hover {
  background: #d0d0e8;
}

.skill-option.selected {
  background: #1a1a2e;
  color: white;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.form-row .form-field {
  flex: 1;
}

.checkbox-field label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #1a1a2e;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  margin-top: 1.4rem;
}

.checkbox-field label.disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.checkbox-field input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.files-loading {
  color: #888;
  font-size: 0.85rem;
}

.no-files {
  color: #aaa;
  font-size: 0.875rem;
}

.files-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: #f8f8fc;
  border-radius: 4px;
  font-size: 0.85rem;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1a1a2e;
}

.file-size {
  color: #aaa;
  font-size: 0.75rem;
  white-space: nowrap;
}

.btn-file-action {
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-file-action:hover { opacity: 0.8; }

.btn-file-delete {
  background: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  cursor: pointer;
  line-height: 1;
}

.btn-file-delete:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-file-delete:not(:disabled):hover { opacity: 0.8; }

.file-upload-area {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-file-upload {
  display: inline-block;
  padding: 6px 14px;
  background: #f0f0f8;
  border: 1px dashed #aaa;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #1a1a2e;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-file-upload:hover:not(.uploading) { background: #e0e0f0; }
.btn-file-upload.uploading { opacity: 0.6; cursor: not-allowed; }

.file-hint {
  font-size: 0.75rem;
  color: #aaa;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
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

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-primary {
  background: #1a1a2e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #e94560;
}
</style>
