<template>
  <div class="skills-manager">
    <div class="skills-column">
      <h3 class="column-title">Toutes les compétences</h3>
      <div class="skills-list">
        <div
          v-for="skill in availableSkills"
          :key="skill.id"
          class="skill-item"
        >
          <span class="skill-name">{{ skill.name }}</span>
          <button class="btn-icon btn-add" title="Ajouter" @click="addSkill(skill.id)">+</button>
        </div>
        <p v-if="availableSkills.length === 0" class="empty-msg">Toutes les compétences sont sélectionnées.</p>
      </div>
    </div>

    <div class="skills-divider">
      <span class="divider-arrow">→</span>
    </div>

    <div class="skills-column">
      <h3 class="column-title">Mes compétences</h3>
      <div class="skills-list">
        <div
          v-for="skill in mySkills"
          :key="skill.id"
          class="skill-item skill-item--mine"
        >
          <span class="skill-name">{{ skill.name }}</span>
          <button class="btn-icon btn-remove" title="Retirer" @click="removeSkill(skill.id)">−</button>
        </div>
        <p v-if="mySkills.length === 0" class="empty-msg">Aucune compétence sélectionnée.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skills'

const props = defineProps<{
  allSkills: Skill[]
  mySkillIds: number[]
}>()

const emit = defineEmits<{
  update: [newIds: number[]]
}>()

const mySkills = computed(() =>
  props.allSkills.filter((s) => props.mySkillIds.includes(s.id))
)

const availableSkills = computed(() =>
  props.allSkills.filter((s) => !props.mySkillIds.includes(s.id))
)

function addSkill(id: number) {
  emit('update', [...props.mySkillIds, id])
}

function removeSkill(id: number) {
  emit('update', props.mySkillIds.filter((sid) => sid !== id))
}
</script>

<style scoped>
.skills-manager {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.skills-column {
  flex: 1;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.column-title {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  background: #1a1a2e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skills-list {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.skill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 4px;
  background: #f8f8fb;
  transition: background 0.15s;
}

.skill-item:hover {
  background: #f0f0f8;
}

.skill-item--mine {
  background: #f0f8f0;
}

.skill-item--mine:hover {
  background: #e0f0e0;
}

.skill-name {
  font-size: 0.875rem;
  color: #1a1a2e;
}

.btn-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 0.8;
}

.btn-add {
  background: #1a1a2e;
  color: white;
}

.btn-remove {
  background: #e94560;
  color: white;
}

.skills-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 2rem;
  color: #aaa;
  font-size: 1.5rem;
}

.empty-msg {
  margin: 1rem 0.5rem;
  font-size: 0.8rem;
  color: #aaa;
  font-style: italic;
}
</style>
