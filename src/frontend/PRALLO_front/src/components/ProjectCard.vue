<template>
  <div class="project-card" @click="emit('click-detail', project)">
    <div class="card-header">
      <h3 class="card-title">{{ project.title }}</h3>
      <div class="card-icons">
        <span v-if="project.isMandatory" class="icon-mandatory" title="Projet obligatoire">!</span>
        <span v-if="project.hasFiles" class="icon-files" title="Fichiers joints">📎</span>
      </div>
    </div>

    <p class="card-description">{{ truncatedDescription }}</p>

    <div v-if="project.skills.length > 0" class="card-skills">
      <span v-for="skill in project.skills" :key="skill.id" class="skill-tag">{{ skill.name }}</span>
    </div>

    <div class="card-footer">
      <span class="card-professor">
        {{ project.professor.firstName }} {{ project.professor.lastName }}
      </span>
      <span v-if="showVoteCount && project.voteCount !== undefined" class="card-votes">
        {{ project.voteCount }} vote{{ project.voteCount !== 1 ? 's' : '' }}
      </span>
    </div>

    <div v-if="canEdit || canDelete" class="card-actions" @click.stop>
      <button v-if="canEdit" class="btn btn-edit" @click="emit('click-edit', project)">Modifier</button>
      <button v-if="canDelete" class="btn btn-delete" @click="emit('click-delete', project)">Supprimer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '@/stores/projects'

const props = defineProps<{
  project: Project
  showVoteCount?: boolean
  canEdit?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  'click-detail': [project: Project]
  'click-edit': [project: Project]
  'click-delete': [project: Project]
}>()

const truncatedDescription = computed(() => {
  if (props.project.description.length <= 100) return props.project.description
  return props.project.description.slice(0, 100) + '...'
})
</script>

<style scoped>
.project-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 2px solid transparent;
}

.project-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  transform: translateY(-2px);
  border-color: #e94560;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  line-height: 1.3;
  overflow-wrap: break-word;
  word-break: break-word;
}

.card-icons {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.icon-mandatory {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #e94560;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.icon-files {
  font-size: 1rem;
}

.card-description {
  font-size: 0.875rem;
  color: #555;
  margin: 0;
  line-height: 1.5;
  overflow-wrap: break-word;
  word-break: break-word;
}

.card-skills {
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
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #888;
  margin-top: auto;
}

.card-professor {
  font-style: italic;
}

.card-votes {
  background: #1a1a2e;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.85;
}

.btn-edit {
  background: #1a1a2e;
  color: white;
}

.btn-delete {
  background: #e94560;
  color: white;
}
</style>
